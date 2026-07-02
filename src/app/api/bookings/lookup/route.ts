// ============================================
// GET /api/bookings/lookup — ค้นหาการจองด้วย booking number
// Query: ?bookingNumber=BK-xxxx
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const bookingNumber = searchParams.get("bookingNumber");
    const phone = searchParams.get("phone");

    if (!bookingNumber && !phone) {
      return errorResponse("กรุณาระบุเลขการจอง (bookingNumber) หรือเบอร์โทรศัพท์ (phone)");
    }

    let booking;

    if (bookingNumber) {
      booking = await prisma.booking.findUnique({
        where: { bookingNumber },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
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
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nickname: true,
              color: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
              phone: true,
            },
          },
          statusLogs: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              note: true,
              changedBy: true,
              createdAt: true,
            },
          },
        },
      });
    } else if (phone) {
      // ค้นหาจากเบอร์โทร
      const customer = await prisma.customer.findFirst({
        where: { phone },
        orderBy: { createdAt: "desc" },
      });

      if (customer) {
        booking = await prisma.booking.findFirst({
          where: {
            customerId: customer.id,
            status: { in: ["PENDING", "CONFIRMED", "ARRIVED", "SERVING"] },
          },
          orderBy: { createdAt: "desc" },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
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
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nickname: true,
                color: true,
              },
            },
            shop: {
              select: {
                id: true,
                name: true,
                code: true,
                address: true,
                phone: true,
              },
            },
          },
        });
      }
    }

    if (!booking) {
      return errorResponse("ไม่พบข้อมูลการจอง", 404);
    }

    return successResponse(booking);
  } catch (error) {
    console.error("GET /api/bookings/lookup error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการค้นหาการจอง", 500);
  }
}
