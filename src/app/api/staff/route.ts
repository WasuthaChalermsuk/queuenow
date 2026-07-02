// ============================================
// GET /api/staff — รายการพนักงาน active
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const shopId = searchParams.get("shopId");
    const serviceId = searchParams.get("serviceId");

    const where: Record<string, unknown> = { isActive: true };
    if (shopId) where.shopId = shopId;

    // ถ้าระบุ serviceId — กรองเฉพาะพนักงานที่ทำบริการนี้ได้
    if (serviceId) {
      where.staffServices = {
        some: { serviceId },
      };
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: [{ firstName: "asc" }],
      select: {
        id: true,
        shopId: true,
        code: true,
        firstName: true,
        lastName: true,
        nickname: true,
        email: true,
        phone: true,
        avatar: true,
        color: true,
        isActive: true,
        maxConcurrentBookings: true,
        shop: {
          select: { id: true, name: true, code: true },
        },
        staffServices: {
          select: {
            service: {
              select: { id: true, name: true, duration: true },
            },
          },
        },
      },
    });

    return successResponse(staff);
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน", 500);
  }
}
