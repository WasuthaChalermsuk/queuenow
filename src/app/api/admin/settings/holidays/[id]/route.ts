// ============================================
// DELETE /api/admin/settings/holidays/[id] — ลบวันหยุดพิเศษ
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await params;

    if (!id) {
      return errorResponse("กรุณาระบุรหัสวันหยุด", 400);
    }

    // ค้นหาวันหยุด
    const holiday = await prisma.specialHoliday.findUnique({
      where: { id },
      select: { id: true, shopId: true, name: true, date: true },
    });

    if (!holiday) {
      return errorResponse("ไม่พบวันหยุดที่ระบุ", 404);
    }

    // ตรวจสอบสิทธิ์
    if (
      session.shopId &&
      session.shopId !== holiday.shopId &&
      session.role !== "SUPER_ADMIN"
    ) {
      return errorResponse("ไม่มีสิทธิ์ในการจัดการร้านค้านี้", 403);
    }

    await prisma.specialHoliday.delete({
      where: { id },
    });

    return successResponse({
      message: `ลบวันหยุด "${holiday.name}" เรียบร้อย`,
      deletedId: id,
    });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("DELETE /api/admin/settings/holidays/[id] error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการลบวันหยุด", 500);
  }
}
