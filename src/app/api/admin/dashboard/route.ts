// ============================================
// GET /api/admin/dashboard — สรุปข้อมูลวันนี้ + รายการจอง
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);

    // ใช้ shopId จาก session หรือรับ query param (สำหรับ SUPER_ADMIN)
    const { searchParams } = req.nextUrl;
    const shopId = session.shopId || searchParams.get("shopId");

    if (!shopId) {
      return errorResponse("กรุณาระบุ shopId", 400);
    }

    // วันที่วันนี้ (UTC)
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayStart = new Date(todayStr + "T00:00:00.000Z");
    const todayEnd = new Date(todayStr + "T23:59:59.999Z");

    // ---------- ดึงข้อมูลทั้งหมดพร้อมกัน ----------
    const [
      todayBookingsTotal,
      servingNow,
      waiting,
      completed,
      cancelled,
      noShow,
      todayBookings,
      shop,
    ] = await Promise.all([
      // จำนวนจองวันนี้ทั้งหมด
      prisma.booking.count({
        where: { shopId, bookingDate: { gte: todayStart, lte: todayEnd } },
      }),
      // กำลังให้บริการ
      prisma.booking.count({
        where: { shopId, bookingDate: { gte: todayStart, lte: todayEnd }, status: "SERVING" },
      }),
      // รอคิว
      prisma.booking.count({
        where: { shopId, bookingDate: { gte: todayStart, lte: todayEnd }, status: { in: ["PENDING", "CONFIRMED", "ARRIVED"] } },
      }),
      // เสร็จแล้ว
      prisma.booking.count({
        where: { shopId, bookingDate: { gte: todayStart, lte: todayEnd }, status: "COMPLETED" },
      }),
      // ยกเลิก
      prisma.booking.count({
        where: { shopId, bookingDate: { gte: todayStart, lte: todayEnd }, status: "CANCELLED" },
      }),
      // ไม่มา
      prisma.booking.count({
        where: { shopId, bookingDate: { gte: todayStart, lte: todayEnd }, status: "NO_SHOW" },
      }),
      // รายการจองวันนี้ (20 ล่าสุด)
      prisma.booking.findMany({
        where: { shopId, bookingDate: { gte: todayStart, lte: todayEnd } },
        orderBy: [{ queuePosition: "asc" }, { createdAt: "asc" }],
        take: 50,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          service: {
            select: { id: true, name: true, duration: true, color: true },
          },
          staff: {
            select: { id: true, firstName: true, lastName: true, nickname: true, color: true },
          },
        },
      }),
      // ข้อมูลร้าน
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { id: true, name: true, code: true },
      }),
    ]);

    return successResponse({
      shop,
      date: todayStr,
      stats: {
        total: todayBookingsTotal,
        servingNow,
        waiting,
        completed,
        cancelled,
        noShow,
      },
      bookings: todayBookings,
    });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/dashboard error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงข้อมูล dashboard", 500);
  }
}
