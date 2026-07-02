// ============================================
// PATCH /api/me/bookings/[id]/cancel — ยกเลิกการจอง (โดยลูกค้า)
// H5: ใช้ JWT token (CustomerSession) แทน query param phone/email
// Header: Authorization: Bearer <customer_token>
// เงื่อนไข: เฉพาะสถานะ PENDING/CONFIRMED และต้องก่อนเวลาจองอย่างน้อย 24 ชม.
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireCustomerAuth,
  AuthError,
} from "@/lib/auth";

const cancelSchema = z.object({
  reason: z.string().max(500, "เหตุผลห้ามเกิน 500 ตัวอักษร").optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse("กรุณาระบุรหัสการจอง", 400);
    }

    // ---------- H5: JWT Auth ----------
    const session = requireCustomerAuth(req);
    // session.id = customer ID จาก token

    // Parse body
    let body: { reason?: string } = {};
    try {
      body = await req.json();
    } catch {
      // body อาจว่างได้
    }

    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "ข้อมูลไม่ถูกต้อง",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }))
      );
    }

    const { reason } = parsed.data;

    // ค้นหาการจอง
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return errorResponse("ไม่พบข้อมูลการจอง", 404);
    }

    // ---------- H5: ตรวจสอบว่าเป็นเจ้าของ booking จาก JWT ----------
    if (booking.customerId !== session.id) {
      return errorResponse("ไม่พบข้อมูลการจองที่ตรงกับบัญชีของคุณ", 404);
    }

    // ตรวจสอบสถานะ — ยกเลิกได้เฉพาะ PENDING หรือ CONFIRMED
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return errorResponse(
        `ไม่สามารถยกเลิกการจองที่มีสถานะ "${booking.status}" ได้`,
        400
      );
    }

    // ตรวจสอบระยะเวลาก่อนถึงเวลาจอง (อย่างน้อย 24 ชม.)
    const now = new Date();
    const bookingDateTime = new Date(
      booking.bookingDate.toISOString().split("T")[0] +
        "T" +
        booking.timeSlot +
        ":00.000Z"
    );
    const hoursUntilBooking =
      (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return errorResponse(
        "ไม่สามารถยกเลิกการจองก่อนเวลาจองน้อยกว่า 24 ชั่วโมง กรุณาติดต่อร้านค้าโดยตรง",
        400
      );
    }

    // ยกเลิกใน transaction
    const nowDate = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: nowDate,
          cancelReason: reason || "ลูกค้ายกเลิก",
        },
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

      await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          fromStatus: booking.status,
          toStatus: "CANCELLED",
          changedBy: "customer",
          note: reason || "ลูกค้ายกเลิก",
        },
      });

      return b;
    });

    return successResponse({
      message: "ยกเลิกการจองเรียบร้อย",
      booking: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, 401);
    }

    console.error("PATCH /api/me/bookings/[id]/cancel error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการยกเลิกการจอง", 500);
  }
}
