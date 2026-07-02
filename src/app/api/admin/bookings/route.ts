// ============================================
// GET /api/admin/bookings — รายการจอง (paginated, filterable)
// Query: ?date=YYYY-MM-DD&status=PENDING&page=1&limit=20&shopId=
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);

    const { searchParams } = req.nextUrl;
    const shopId = session.shopId || searchParams.get("shopId");
    const dateStr = searchParams.get("date");
    const status = searchParams.get("status");
    const search = searchParams.get("search"); // ค้นหาจากชื่อ/เบอร์/เลขจอง
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    if (!shopId) {
      return errorResponse("กรุณาระบุ shopId", 400);
    }

    // ---------- Build where clause ----------
    const where: Record<string, unknown> = { shopId };

    if (dateStr) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        return errorResponse("รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)");
      }
      where.bookingDate = {
        gte: new Date(dateStr + "T00:00:00.000Z"),
        lt: new Date(dateStr + "T23:59:59.999Z"),
      };
    }

    if (status) {
      const validStatuses = [
        "PENDING", "CONFIRMED", "ARRIVED", "SERVING",
        "COMPLETED", "CANCELLED", "NO_SHOW",
      ];
      if (!validStatuses.includes(status)) {
        return errorResponse("สถานะไม่ถูกต้อง");
      }
      where.status = status;
    }

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search } },
        { customer: { firstName: { contains: search } } },
        { customer: { lastName: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    // ---------- Query ----------
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          },
          service: {
            select: { id: true, name: true, duration: true, price: true, color: true },
          },
          staff: {
            select: { id: true, firstName: true, lastName: true, nickname: true, color: true },
          },
          shop: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.booking.count({ where }),
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
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/bookings error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงรายการจอง", 500);
  }
}
