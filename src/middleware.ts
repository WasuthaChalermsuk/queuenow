// ============================================
// H6: CORS Middleware สำหรับ Public API Routes
// ============================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Allowed origins สำหรับ CORS
 */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://queuenow.vercel.app",
  "https://queuenow.com",
  "https://www.queuenow.com",
];

/**
 * Public API routes ที่ต้องมี CORS headers
 */
const PUBLIC_API_PREFIXES = [
  "/api/bookings",
  "/api/shops",
  "/api/services",
  "/api/staff",
  "/api/time-slots",
  "/api/me",
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getAllowedOrigin(origin: string | null): string {
  if (!origin) return "*";

  // Development: allow any localhost
  if (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) {
    return origin;
  }

  // Production: check against allowed list
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  // Fallback: หากเป็น production domain queue-now ให้อนุญาต
  if (origin.endsWith(".queuenow.com") || origin.endsWith(".queuenow.vercel.app")) {
    return origin;
  }

  return ""; // ไม่ allow origin นี้
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");

  // เฉพาะ public API routes
  if (!isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Handle preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    const allowedOrigin = getAllowedOrigin(origin);

    if (allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    }
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  // สำหรับ request ปกติ: เพิ่ม CORS headers
  const response = NextResponse.next();
  const allowedOrigin = getAllowedOrigin(origin);

  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Vary", "Origin");
  }
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  return response;
}

/**
 * กำหนดว่า middleware นี้ทำงานกับ path ไหน
 */
export const config = {
  matcher: [
    "/api/:path*",
  ],
};
