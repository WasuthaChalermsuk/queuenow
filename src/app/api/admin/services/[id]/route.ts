// ============================================
// GET + PUT + DELETE /api/admin/services/[id] — จัดการบริการรายตัว
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

const updateServiceSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อบริการ").optional(),
  nameEn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(1, "ระยะเวลาต้องมากกว่า 0 นาที").optional(),
  price: z.number().min(0).optional().nullable(),
  color: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET — ดึงข้อมูลบริการรายตัว
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        shop: { select: { id: true, name: true, code: true } },
        _count: { select: { bookings: true, staffServices: true } },
        staffServices: {
          include: {
            staff: {
              select: { id: true, firstName: true, lastName: true, nickname: true },
            },
          },
        },
      },
    });

    if (!service) {
      return errorResponse("ไม่พบบริการ", 404);
    }

    // ตรวจสอบสิทธิ์
    if (session.shopId && session.shopId !== service.shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการดูข้อมูลนี้", 403);
    }

    return successResponse(service);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/services/[id] error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลบริการ", 500);
  }
}

/**
 * PUT — อัปเดตบริการ
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true, shopId: true },
    });

    if (!service) {
      return errorResponse("ไม่พบบริการ", 404);
    }

    if (session.shopId && session.shopId !== service.shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการแก้ไขบริการนี้", 403);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("รูปแบบข้อมูลไม่ถูกต้อง");
    }

    const parsed = updateServiceSchema.safeParse(body);
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

    const updated = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    return successResponse(updated);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("PUT /api/admin/services/[id] error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการอัปเดตบริการ", 500);
  }
}

/**
 * DELETE — ลบบริการ (soft delete: set isActive = false)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true, shopId: true },
    });

    if (!service) {
      return errorResponse("ไม่พบบริการ", 404);
    }

    if (session.shopId && session.shopId !== service.shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการลบบริการนี้", 403);
    }

    // Soft delete
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse({ message: "ลบบริการเรียบร้อย" });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("DELETE /api/admin/services/[id] error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการลบบริการ", 500);
  }
}
