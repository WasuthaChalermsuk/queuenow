// ============================================
// GET /api/staff/bookings — ตารางคิวพนักงานวันนี้
// Query: ?date=YYYY-MM-DD (default: วันนี้)
// ต้องมี JWT token (staff login)
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);

    const { searchParams } = req.nextUrl;
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // ตรวจสอบรูปแบบวันที่
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return errorResponse("รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-dd)", 400);
    }

    // ค้นหา staff record จาก email ใน JWT
    const staffRecord = await prisma.staff.findFirst({
      where: {
        email: session.email,
        isActive: true,
      },
      select: { id: true, shopId: true },
    });

    if (!staffRecord) {
      return errorResponse("ไม่พบข้อมูลพนักงานที่เชื่อมโยงกับบัญชีนี้", 404);
    }

    const bookingDateStart = new Date(dateStr + "T00:00:00.000Z");
    const bookingDateEnd = new Date(dateStr + "T23:59:59.999Z");

    // ดึงรายการจองของพนักงานในวันที่ระบุ
    const bookings = await prisma.booking.findMany({
      where: {
        staffId: staffRecord.id,
        shopId: staffRecord.shopId,
        bookingDate: {
          gte: bookingDateStart,
          lte: bookingDateEnd,
        },
        status: {
          in: ["PENDING", "CONFIRMED", "ARRIVED", "SERVING", "COMPLETED"],
        },
      },
      orderBy: [
        { queuePosition: "asc" },
        { timeSlot: "asc" },
      ],
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            color: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // สรุปจำนวนตามสถานะ
    const summary = {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
      arrived: bookings.filter((b) => b.status === "ARRIVED").length,
      serving: bookings.filter((b) => b.status === "SERVING").length,
      completed: bookings.filter((b) => b.status === "COMPLETED").length,
    };

    return successResponse({
      date: dateStr,
      staffId: staffRecord.id,
      summary,
      bookings,
    });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/staff/bookings error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงตารางคิว", 500);
  }
}
