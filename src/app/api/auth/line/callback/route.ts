// ============================================
// QueueNow — LINE Login Callback
// GET /api/auth/line/callback — handle OAuth callback
// State verification: signed JWT (no cookies needed)
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCustomerToken } from "@/lib/auth";
import crypto from "crypto";

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || "";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function verifyState(state: string): { returnUrl: string; nonce: string } | null {
  try {
    const [b64, sig] = state.split(".");
    if (!b64 || !sig) return null;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(b64).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (!payload.returnUrl) return null;
    return payload;
  } catch {
    return null;
  }
}

interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("LINE OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        `${APP_URL}/?error=line_auth_failed&message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(`${APP_URL}/?error=missing_code`);
    }

    // Verify signed state (no cookies!)
    if (!state) {
      return NextResponse.json(
        { success: false, error: "Missing state parameter" },
        { status: 400 }
      );
    }

    const stateData = verifyState(state);
    if (!stateData) {
      console.error("LINE OAuth: invalid state signature");
      return NextResponse.json(
        { success: false, error: "State ไม่ถูกต้อง — อาจเป็นการโจมตี CSRF" },
        { status: 400 }
      );
    }

    const returnUrl = stateData.returnUrl;

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
        redirect_uri: `${APP_URL}/api/auth/line/callback`,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("LINE token exchange failed:", tokenResponse.status, errorText);
      return NextResponse.redirect(`${APP_URL}/?error=token_exchange_failed`);
    }

    const tokenData: LineTokenResponse = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${APP_URL}/?error=no_access_token`);
    }

    // Get LINE profile
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(`${APP_URL}/?error=profile_fetch_failed`);
    }

    const profile: LineProfile = await profileResponse.json();

    if (!profile.userId) {
      return NextResponse.redirect(`${APP_URL}/?error=no_user_id`);
    }

    // Find or create customer
    const displayName = profile.displayName || "LINE User";
    const [firstName, ...lastNameParts] = displayName.trim().split(" ");
    const lastName = lastNameParts.join(" ") || "";

    let customer = await prisma.customer.findUnique({
      where: { lineUserId: profile.userId },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          firstName: firstName || displayName,
          lastName: lastName || "-",
          lineUserId: profile.userId,
        },
      });
    } else {
      if (customer.firstName === "LINE User" || !customer.firstName) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            firstName: firstName || customer.firstName,
            lastName: lastName || customer.lastName,
          },
        });
      }
    }

    // Create JWT for customer
    const token = createCustomerToken({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      lineUserId: customer.lineUserId,
    });

    // Redirect back to frontend with token
    const redirectUrl = new URL(returnUrl, APP_URL);
    redirectUrl.searchParams.set("token", token);

    const response = NextResponse.redirect(redirectUrl.toString());

    // Set token cookie (httpOnly)
    response.cookies.set("queuenow_token", token, {
      httpOnly: true,
      secure: APP_URL.startsWith("https"),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LINE callback unexpected error:", error);
    return NextResponse.redirect(`${APP_URL}/?error=internal_error`);
  }
}
