// ============================================
// QueueNow — JWT Auth Helpers (Web Crypto API)
// ============================================
import crypto from "crypto";
import { NextRequest } from "next/server";
import { AdminSession, CustomerSession } from "./types";

// H3: ห้ามใช้ fallback secret ใน production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is required in production environment.\n" +
      "Set JWT_SECRET=<your-secure-random-secret> in your environment variables."
    );
  }
  console.warn(
    "⚠️  WARNING: JWT_SECRET not set — using dev fallback. " +
    "DO NOT use in production!"
  );
}
const JWT_SECRET = process.env.JWT_SECRET || "queuenow-dev-secret-change-me";

// ============================================
// Password hashing (PBKDF2)
// ============================================

/**
 * Hash password ด้วย PBKDF2
 * Returns "hexSalt:hexHash"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * ตรวจสอบ password กับ hash ที่เก็บไว้
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return hash === originalHash;
}

// ============================================
// Token sign / verify
// ============================================

function base64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function fromBase64url(str: string): string {
  return Buffer.from(str, "base64url").toString("utf-8");
}

function hmacSign(data: string): string {
  return crypto
    .createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64url");
}

/**
 * สร้าง token สำหรับ Admin session
 * Format: header.payload.signature (base64url)
 */
export function createToken(payload: AdminSession): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 วัน
    })
  );
  const signature = hmacSign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

/**
 * สร้าง token สำหรับ Customer session (LINE Login)
 * Format: header.payload.signature (base64url)
 */
export function createCustomerToken(payload: CustomerSession): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 วัน
    })
  );
  const signature = hmacSign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

/**
 * ตรวจสอบ customer token และคืนค่า CustomerSession
 */
export function verifyCustomerToken(token: string): CustomerSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, bodyB64, sigB64] = parts;
    const expectedSig = hmacSign(`${headerB64}.${bodyB64}`);
    if (sigB64 !== expectedSig) return null;

    const payload = JSON.parse(fromBase64url(bodyB64));

    if (payload.exp && Date.now() > payload.exp * 1000) {
      return null;
    }

    return {
      id: payload.id,
      firstName: payload.firstName,
      lastName: payload.lastName,
      lineUserId: payload.lineUserId,
    };
  } catch {
    return null;
  }
}

/**
 * ตรวจสอบ token และคืนค่า AdminSession
 */
export function verifyToken(token: string): AdminSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, bodyB64, sigB64] = parts;
    const expectedSig = hmacSign(`${headerB64}.${bodyB64}`);
    if (sigB64 !== expectedSig) return null;

    const payload = JSON.parse(fromBase64url(bodyB64));

    // ตรวจสอบ expiration
    if (payload.exp && Date.now() > payload.exp * 1000) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      shopId: payload.shopId,
      shopName: payload.shopName,
    };
  } catch {
    return null;
  }
}

/**
 * Middleware helper — ดึง customer session จาก request header
 * throw error ถ้าไม่ authenticated
 */
export function requireCustomerAuth(req: NextRequest): CustomerSession {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("กรุณาเข้าสู่ระบบก่อนใช้งาน");
  }
  const token = authHeader.slice(7);
  const session = verifyCustomerToken(token);
  if (!session) {
    throw new AuthError("Token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }
  return session;
}

/**
 * Middleware helper — ดึง session จาก request header
 * throw error ถ้าไม่ authenticated
 */
export function requireAuth(req: NextRequest): AdminSession {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("กรุณาเข้าสู่ระบบก่อนใช้งาน");
  }
  const token = authHeader.slice(7);
  const session = verifyToken(token);
  if (!session) {
    throw new AuthError("Token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }
  return session;
}

/**
 * Optional auth — ดึง session โดยไม่ throw error (lightweight)
 * ตรวจสอบ header ก่อนเรียก verifyToken ลด overhead
 */
export function getSession(req: NextRequest): AdminSession | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  const session = verifyToken(token);
  return session;
}

// ============================================
// Auth Error class
// ============================================

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// ============================================
// Standard API response helpers
// ============================================

export function successResponse<T>(data: T, status = 200) {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function errorResponse(error: string, status = 400, details?: unknown) {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      ...(details ? { details } : {}),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
