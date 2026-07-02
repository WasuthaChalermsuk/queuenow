// ============================================
// QueueNow — Customer Profile API
// GET /api/me — ข้อมูลโปรไฟล์ลูกค้า (จาก LINE token)
// อ่าน token จาก cookie (queuenow_token) หรือ Authorization header
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomerToken, successResponse, errorResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // --- ดึง token จากหลายแหล่ง ---
    let token: string | undefined;

    // 1. จาก cookie (set โดย LINE callback)
    token = req.cookies.get("queuenow_token")?.value;

    // 2. จาก Authorization header
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    // 3. จาก query param (สำหรับกรณี client-side)
    if (!token) {
      const { searchParams } = req.nextUrl;
      token = searchParams.get("token") || undefined;
    }

    if (!token) {
      return errorResponse("กรุณาเข้าสู่ระบบด้วย LINE ก่อน", 401);
    }

    // --- ตรวจสอบ token ---
    const session = verifyCustomerToken(token);
    if (!session) {
      return errorResponse("Token ไม่ถูกต้องหรือหมดอายุ", 401);
    }

    // --- ดึงข้อมูลลูกค้าจาก DB ---
    const customer = await prisma.customer.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        lineUserId: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return errorResponse("ไม่พบข้อมูลลูกค้า", 404);
    }

    return successResponse(customer);
  } catch (error) {
    console.error("GET /api/me error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงข้อมูล", 500);
  }
}
