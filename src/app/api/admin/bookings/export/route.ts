// ============================================
// GET /api/admin/bookings/export — Export CSV
// Query: ?shopId=&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=
// Returns: text/csv download
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAuth } from "@/lib/auth";

/**
 * Escape CSV field — ป้องกัน comma, quote, newline
 */
function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Format date for CSV
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format datetime for CSV
 */
function formatDateTime(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().replace("T", " ").substring(0, 19);
}

export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);

    const { searchParams } = req.nextUrl;
    const shopId = session.shopId || searchParams.get("shopId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    if (!shopId) {
      return errorResponse("กรุณาระบุ shopId", 400);
    }

    // ตรวจสอบสิทธิ์
    if (
      session.shopId &&
      session.shopId !== shopId &&
      session.role !== "SUPER_ADMIN"
    ) {
      return errorResponse("ไม่มีสิทธิ์ในการเข้าถึงข้อมูลร้านค้านี้", 403);
    }

    // Validate dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return errorResponse("รูปแบบวันที่เริ่มต้นไม่ถูกต้อง (YYYY-MM-DD)", 400);
    }
    if (endDate && !dateRegex.test(endDate)) {
      return errorResponse("รูปแบบวันที่สิ้นสุดไม่ถูกต้อง (YYYY-MM-DD)", 400);
    }

    // Build where clause
    const where: Record<string, unknown> = { shopId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate + "T00:00:00.000Z");
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate + "T23:59:59.999Z");
      }
      where.bookingDate = dateFilter;
    }

    if (status) {
      const validStatuses = [
        "PENDING", "CONFIRMED", "ARRIVED", "SERVING",
        "COMPLETED", "CANCELLED", "NO_SHOW",
      ];
      if (validStatuses.includes(status)) {
        where.status = status;
      }
    }

    // Query bookings
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
        shop: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Build CSV
    const headers = [
      "เลขการจอง",
      "วันที่จอง",
      "เวลาจอง",
      "สถานะ",
      "ตำแหน่งคิว",
      "ชื่อลูกค้า",
      "นามสกุลลูกค้า",
      "เบอร์โทร",
      "อีเมล",
      "บริการ",
      "ระยะเวลา (นาที)",
      "ราคา",
      "พนักงาน",
      "ร้านค้า",
      "หมายเหตุ",
      "เวลามาถึง",
      "เวลาเริ่ม",
      "เวลาเสร็จ",
      "เวลายกเลิก",
      "เหตุผลยกเลิก",
      "สร้างเมื่อ",
    ];

    const csvRows: string[] = [];
    csvRows.push(headers.map(escapeCsvField).join(","));

    for (const b of bookings) {
      const staffName = b.staff
        ? `${b.staff.firstName} ${b.staff.lastName}${b.staff.nickname ? ` (${b.staff.nickname})` : ""}`
        : "-";

      const row = [
        b.bookingNumber,
        formatDate(b.bookingDate),
        b.timeSlot,
        b.status,
        b.queuePosition ?? "",
        b.customer.firstName,
        b.customer.lastName,
        b.customer.phone ?? "",
        b.customer.email ?? "",
        b.service.name,
        b.service.duration,
        b.service.price ?? "",
        staffName,
        b.shop.name,
        b.notes ?? "",
        formatDateTime(b.arrivedAt),
        formatDateTime(b.startedAt),
        formatDateTime(b.completedAt),
        formatDateTime(b.cancelledAt),
        b.cancelReason ?? "",
        formatDateTime(b.createdAt),
      ];

      csvRows.push(row.map(escapeCsvField).join(","));
    }

    const csvContent = "\uFEFF" + csvRows.join("\n"); // BOM for Excel UTF-8

    // Generate filename
    const filename = `bookings_export_${shopId.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/bookings/export error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการส่งออกข้อมูล", 500);
  }
}
