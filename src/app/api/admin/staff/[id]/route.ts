// ============================================
// GET + PUT + DELETE /api/admin/staff/[id] — จัดการพนักงานรายคน
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

const updateStaffSchema = z.object({
  code: z.string().optional().nullable(),
  firstName: z.string().min(1, "กรุณากรอกชื่อ").optional(),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล").optional(),
  nickname: z.string().optional().nullable(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  maxConcurrentBookings: z.number().int().min(1).optional(),
  serviceIds: z.array(z.string()).optional(),
});

/**
 * GET — ดึงข้อมูลพนักงานรายคน
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        shop: { select: { id: true, name: true, code: true } },
        staffServices: {
          include: {
            service: {
              select: { id: true, name: true, duration: true, color: true },
            },
          },
        },
        breakTimes: {
          orderBy: { startTime: "desc" },
          take: 20,
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!staff) {
      return errorResponse("ไม่พบพนักงาน", 404);
    }

    if (session.shopId && session.shopId !== staff.shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการดูข้อมูลนี้", 403);
    }

    return successResponse(staff);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/staff/[id] error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน", 500);
  }
}

/**
 * PUT — อัปเดตข้อมูลพนักงาน
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      select: { id: true, shopId: true },
    });

    if (!staff) {
      return errorResponse("ไม่พบพนักงาน", 404);
    }

    if (session.shopId && session.shopId !== staff.shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้", 403);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("รูปแบบข้อมูลไม่ถูกต้อง");
    }

    const parsed = updateStaffSchema.safeParse(body);
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

    const { serviceIds, ...staffData } = parsed.data;

    // อัปเดตใน transaction
    const updated = await prisma.$transaction(async (tx) => {
      // อัปเดตข้อมูล staff
      const s = await tx.staff.update({
        where: { id },
        data: staffData,
      });

      // ถ้ามี serviceIds → จัดการ staffServices ใหม่
      if (serviceIds !== undefined) {
        // ลบของเก่าทั้งหมด แล้วเพิ่มใหม่
        await tx.staffService.deleteMany({
          where: { staffId: id },
        });
        if (serviceIds.length > 0) {
          await tx.staffService.createMany({
            data: serviceIds.map((serviceId) => ({
              staffId: id,
              serviceId,
            })),
          });
        }
      }

      return tx.staff.findUnique({
        where: { id },
        include: {
          staffServices: {
            include: {
              service: {
                select: { id: true, name: true, duration: true, color: true },
              },
            },
          },
          shop: { select: { id: true, name: true, code: true } },
        },
      });
    });

    return successResponse(updated);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("PUT /api/admin/staff/[id] error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน", 500);
  }
}

/**
 * DELETE — ลบพนักงาน (soft delete: set isActive = false)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      select: { id: true, shopId: true },
    });

    if (!staff) {
      return errorResponse("ไม่พบพนักงาน", 404);
    }

    if (session.shopId && session.shopId !== staff.shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการลบข้อมูลนี้", 403);
    }

    await prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse({ message: "ลบพนักงานเรียบร้อย" });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("DELETE /api/admin/staff/[id] error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการลบพนักงาน", 500);
  }
}
