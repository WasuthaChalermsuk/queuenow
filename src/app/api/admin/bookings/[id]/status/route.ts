// ============================================
// PATCH /api/admin/bookings/[id]/status — เปลี่ยนสถานะการจอง
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";
import { sendLineMessage, buildConfirmedMessage, buildCancelledMessage } from "@/lib/line";
import { formatDateThai } from "@/lib/utils";

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING", "CONFIRMED", "ARRIVED", "SERVING",
    "COMPLETED", "CANCELLED", "NO_SHOW",
  ], { errorMap: () => ({ message: "สถานะไม่ถูกต้อง" }) }),
  note: z.string().max(500, "หมายเหตุห้ามเกิน 500 ตัวอักษร").optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await params;

    if (!id) {
      return errorResponse("กรุณาระบุรหัสการจอง");
    }

    // ตรวจสอบว่า booking มีอยู่จริง
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, shopId: true, status: true, bookingNumber: true },
    });

    if (!booking) {
      return errorResponse("ไม่พบข้อมูลการจอง", 404);
    }

    // ตรวจสอบสิทธิ์ (ต้องเป็น shop เดียวกัน หรือ SUPER_ADMIN)
    if (session.shopId && session.shopId !== booking.shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการจัดการการจองนี้", 403);
    }

    // ---------- Validate body ----------
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("รูปแบบข้อมูลไม่ถูกต้อง");
    }

    const parsed = updateStatusSchema.safeParse(body);
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

    const { status: newStatus, note } = parsed.data;
    const oldStatus = booking.status;

    // ห้ามเปลี่ยนสถานะเดิมซ้ำ
    if (oldStatus === newStatus) {
      return errorResponse(`การจองนี้มีสถานะ ${oldStatus} อยู่แล้ว`, 400);
    }

    // ---------- Update in transaction ----------
    const now = new Date();
    const updateData: Record<string, unknown> = { status: newStatus };
    const logData: Record<string, unknown> = {
      bookingId: id,
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedBy: session.id,
      note: note || null,
    };

    // เติม timestamp ตามสถานะ
    switch (newStatus) {
      case "ARRIVED":
        updateData.arrivedAt = now;
        break;
      case "SERVING":
        updateData.startedAt = now;
        break;
      case "COMPLETED":
        updateData.completedAt = now;
        break;
      case "CANCELLED":
        updateData.cancelledAt = now;
        if (note) updateData.cancelReason = note;
        break;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true, lineUserId: true },
          },
          service: {
            select: { id: true, name: true, duration: true, color: true },
          },
          staff: {
            select: { id: true, firstName: true, lastName: true, nickname: true, color: true },
          },
          shop: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      await tx.bookingStatusLog.create({ data: logData as never });

      return b;
    });

    // ---------- ส่ง LINE Notification (fire-and-forget) ----------
    // ไม่ต้องรอ และถ้าส่งไม่สำเร็จต้องไม่ทำให้ API พัง
    if (updated.customer?.lineUserId) {
      const lineUserId = updated.customer.lineUserId;
      const bookingDate = formatDateThai(updated.bookingDate);
      const timeSlot = updated.timeSlot;
      const serviceName = updated.service?.name || "N/A";
      const shopName = updated.shop?.name;

      if (newStatus === "CONFIRMED") {
        void sendLineMessage(
          lineUserId,
          buildConfirmedMessage({
            bookingNumber: updated.bookingNumber,
            date: bookingDate,
            time: timeSlot,
            serviceName,
            shopName,
          })
        ).catch((err) => console.error("[LINE] Failed to send CONFIRMED message:", err));
      } else if (newStatus === "CANCELLED") {
        void sendLineMessage(
          lineUserId,
          buildCancelledMessage({
            bookingNumber: updated.bookingNumber,
            date: bookingDate,
            time: timeSlot,
            serviceName,
            reason: note || updated.cancelReason || undefined,
            shopName,
          })
        ).catch((err) => console.error("[LINE] Failed to send CANCELLED message:", err));
      }
    }

    return successResponse(updated);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("PATCH /api/admin/bookings/[id]/status error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการอัปเดตสถานะ", 500);
  }
}
