// ============================================
// GET /api/me/bookings — ประวัติการจองของลูกค้า
// H4: ใช้ JWT token (CustomerSession) แทน query param phone/email
// Header: Authorization: Bearer <customer_token>
// Query: ?status=upcoming|past&page=1&limit=20
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireCustomerAuth,
  AuthError,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // ---------- H4: JWT Auth ----------
    const session = requireCustomerAuth(req);
    // session.id = customer ID จาก token

    const { searchParams } = req.nextUrl;
    const statusFilter = searchParams.get("status"); // "upcoming" | "past"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );

    // สร้าง where clause สำหรับ booking
    const now = new Date();
    const bookingWhere: Record<string, unknown> = {
      customerId: session.id,
    };

    // กรองตามสถานะ
    if (statusFilter === "upcoming") {
      // การจองที่กำลังจะมาถึง: PENDING, CONFIRMED, ARRIVED, SERVING
      bookingWhere.status = {
        in: ["PENDING", "CONFIRMED", "ARRIVED", "SERVING"],
      };
      bookingWhere.bookingDate = {
        gte: new Date(now.toISOString().split("T")[0] + "T00:00:00.000Z"),
      };
    } else if (statusFilter === "past") {
      // การจองที่ผ่านไปแล้ว: COMPLETED, CANCELLED, NO_SHOW
      bookingWhere.OR = [
        { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
        {
          status: { in: ["PENDING", "CONFIRMED", "ARRIVED", "SERVING"] },
          bookingDate: {
            lt: new Date(now.toISOString().split("T")[0] + "T00:00:00.000Z"),
          },
        },
      ];
    }

    // ดึงข้อมูล
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
      }),
      prisma.booking.count({ where: bookingWhere }),
    ]);

    return successResponse({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, 401);
    }

    console.error("GET /api/me/bookings error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงประวัติการจอง", 500);
  }
}
