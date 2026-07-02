// ============================================
// QueueNow — LINE Login Callback
// GET /api/auth/line/callback — handle OAuth callback
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCustomerToken } from "@/lib/auth";

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || "";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

    // --- Handle LINE error response ---
    if (error) {
      console.error("LINE OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        `${APP_URL}/?error=line_auth_failed&message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${APP_URL}/?error=missing_code`
      );
    }

    // --- Verify state (CSRF protection) ---
    const storedState = req.cookies.get("line_oauth_state")?.value;
    if (!state || state !== storedState) {
      console.error("LINE OAuth: state mismatch", { received: state, stored: storedState });
      return NextResponse.json(
        { success: false, error: "State ไม่ตรงกัน — อาจเป็นการโจมตี CSRF" },
        { status: 400 }
      );
    }

    // --- Exchange code for access token ---
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
      return NextResponse.redirect(
        `${APP_URL}/?error=token_exchange_failed`
      );
    }

    const tokenData: LineTokenResponse = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("LINE token response missing access_token:", tokenData);
      return NextResponse.redirect(
        `${APP_URL}/?error=no_access_token`
      );
    }

    // --- Get LINE profile ---
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error("LINE profile fetch failed:", profileResponse.status, errorText);
      return NextResponse.redirect(
        `${APP_URL}/?error=profile_fetch_failed`
      );
    }

    const profile: LineProfile = await profileResponse.json();

    if (!profile.userId) {
      console.error("LINE profile missing userId:", profile);
      return NextResponse.redirect(
        `${APP_URL}/?error=no_user_id`
      );
    }

    // --- Find or create customer ---
    const displayName = profile.displayName || "LINE User";
    const [firstName, ...lastNameParts] = displayName.trim().split(" ");
    const lastName = lastNameParts.join(" ") || "";

    let customer = await prisma.customer.findUnique({
      where: { lineUserId: profile.userId },
    });

    if (!customer) {
      // Create new customer with LINE profile info
      customer = await prisma.customer.create({
        data: {
          firstName: firstName || displayName,
          lastName: lastName || "-",
          lineUserId: profile.userId,
        },
      });
    } else {
      // Update display name if it changed (optional — keep existing)
      // Only update if firstName is empty/placeholder
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

    // --- Create JWT token for customer ---
    const token = createCustomerToken({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      lineUserId: customer.lineUserId,
    });

    // --- Redirect back to frontend with token ---
    // อ่าน returnUrl จาก cookie (default: "/")
    const returnUrl = req.cookies.get("line_return_url")?.value || "/";
    const redirectUrl = new URL(returnUrl, APP_URL);
    redirectUrl.searchParams.set("token", token);

    const response = NextResponse.redirect(redirectUrl.toString());

    // Clear the state cookie
    response.cookies.set("line_oauth_state", "", {
      httpOnly: true,
      secure: APP_URL.startsWith("https"),
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    // Clear the returnUrl cookie
    response.cookies.set("line_return_url", "", {
      httpOnly: true,
      secure: APP_URL.startsWith("https"),
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    // Set token as cookie (httpOnly for security — server-side reads)
    response.cookies.set("queuenow_token", token, {
      httpOnly: true,
      secure: APP_URL.startsWith("https"),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LINE callback unexpected error:", error);
    return NextResponse.redirect(
      `${APP_URL}/?error=internal_error`
    );
  }
}
