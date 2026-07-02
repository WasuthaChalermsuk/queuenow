// ============================================
// GET /api/shop — ข้อมูลร้านค้า
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");

    if (code) {
      // ค้นหาจากรหัสร้าน
      const shop = await prisma.shop.findUnique({
        where: { code },
        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
          description: true,
          logo: true,
          address: true,
          phone: true,
          email: true,
          lineId: true,
          timezone: true,
          isActive: true,
          maxQueuePerSlot: true,
        },
      });

      if (!shop || !shop.isActive) {
        return errorResponse("ไม่พบข้อมูลร้านค้า", 404);
      }

      return successResponse(shop);
    }

    // คืนค่าร้านแรกที่ active (สำหรับ single-shop mode)
    const shop = await prisma.shop.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        lineId: true,
        timezone: true,
        isActive: true,
        maxQueuePerSlot: true,
      },
    });

    if (!shop) {
      return errorResponse("ไม่พบข้อมูลร้านค้า", 404);
    }

    return successResponse(shop);
  } catch (error) {
    console.error("GET /api/shop error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลร้านค้า", 500);
  }
}
