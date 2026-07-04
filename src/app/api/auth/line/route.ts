// ============================================
// QueueNow — LINE Login Redirect
// GET /api/auth/line — redirect to LINE OAuth
// State: signed JWT (no cookies needed — survives cross-domain)
// ============================================
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function signState(payload: Record<string, string>): string {
  const data = JSON.stringify(payload);
  const b64 = Buffer.from(data).toString("base64url");
  const hmac = crypto.createHmac("sha256", JWT_SECRET).update(b64).digest("base64url");
  return `${b64}.${hmac}`;
}

export async function GET(req: NextRequest) {
  if (!LINE_CHANNEL_ID) {
    return NextResponse.json(
      { success: false, error: "LINE Login ยังไม่ได้ตั้งค่า (LINE_CHANNEL_ID)" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get("returnUrl") || "/";
  const nonce = crypto.randomBytes(12).toString("hex");

  // Encode returnUrl + nonce into signed state (no cookies!)
  const state = signState({ returnUrl, nonce });

  const redirectUri = `${APP_URL}/api/auth/line/callback`;

  const authUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", LINE_CHANNEL_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", "profile openid");

  return NextResponse.redirect(authUrl.toString());
}
