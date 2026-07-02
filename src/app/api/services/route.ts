// ============================================
// GET /api/services — รายการบริการที่ active
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const shopId = searchParams.get("shopId");
    const category = searchParams.get("category"); // reserved for future

    const where: Record<string, unknown> = { isActive: true };
    if (shopId) where.shopId = shopId;

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        shopId: true,
        name: true,
        nameEn: true,
        description: true,
        duration: true,
        price: true,
        color: true,
        sortOrder: true,
        isActive: true,
        shop: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { staffServices: true },
        },
      },
    });

    return successResponse(services);
  } catch (error) {
    console.error("GET /api/services error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงรายการบริการ", 500);
  }
}
