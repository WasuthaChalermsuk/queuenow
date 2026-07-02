// ============================================
// GET + POST /api/admin/staff — รายการพนักงาน + สร้างใหม่
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

const createStaffSchema = z.object({
  shopId: z.string().min(1, "กรุณาระบุร้านค้า"),
  code: z.string().optional(),
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  nickname: z.string().optional(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  maxConcurrentBookings: z.number().int().min(1, "ต้องมากกว่า 0").optional(),
  serviceIds: z.array(z.string()).optional(), // บริการที่พนักงานทำได้
});

/**
 * GET — ดึงรายการพนักงานทั้งหมด (รวม inactive)
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);

    const { searchParams } = req.nextUrl;
    const shopId = session.shopId || searchParams.get("shopId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    if (!shopId) {
      return errorResponse("กรุณาระบุ shopId", 400);
    }

    const where: Record<string, unknown> = { shopId };
    if (!includeInactive) where.isActive = true;

    const staff = await prisma.staff.findMany({
      where,
      orderBy: [{ firstName: "asc" }],
      include: {
        shop: { select: { id: true, name: true, code: true } },
        staffServices: {
          include: {
            service: {
              select: { id: true, name: true, duration: true, color: true },
            },
          },
        },
        _count: {
          select: { bookings: true, breakTimes: true },
        },
      },
    });

    return successResponse(staff);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/staff error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงรายการพนักงาน", 500);
  }
}

/**
 * POST — สร้างพนักงานใหม่
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAuth(req);

    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("รูปแบบข้อมูลไม่ถูกต้อง");
    }

    const parsed = createStaffSchema.safeParse(body);
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

    const data = parsed.data;

    // ตรวจสอบสิทธิ์
    if (session.shopId && session.shopId !== data.shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการจัดการร้านค้านี้", 403);
    }

    // ตรวจสอบว่า shop มีอยู่จริง
    const shop = await prisma.shop.findUnique({
      where: { id: data.shopId },
    });
    if (!shop) {
      return errorResponse("ไม่พบร้านค้า", 404);
    }

    // ตรวจสอบ code ซ้ำ (ถ้าระบุ)
    if (data.code) {
      const existing = await prisma.staff.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        return errorResponse("รหัสพนักงานนี้มีอยู่แล้ว", 409);
      }
    }

    // สร้าง staff + staffServices ใน transaction
    const staff = await prisma.$transaction(async (tx) => {
      const s = await tx.staff.create({
        data: {
          shopId: data.shopId,
          code: data.code || null,
          firstName: data.firstName,
          lastName: data.lastName,
          nickname: data.nickname || null,
          email: data.email || null,
          phone: data.phone || null,
          avatar: data.avatar || null,
          color: data.color || "#8b5cf6",
          isActive: data.isActive ?? true,
          maxConcurrentBookings: data.maxConcurrentBookings ?? 1,
        },
      });

      // ผูกบริการที่พนักงานทำได้
      if (data.serviceIds && data.serviceIds.length > 0) {
        await tx.staffService.createMany({
          data: data.serviceIds.map((serviceId) => ({
            staffId: s.id,
            serviceId,
          })),
        });
      }

      return tx.staff.findUnique({
        where: { id: s.id },
        include: {
          staffServices: {
            include: {
              service: {
                select: { id: true, name: true, duration: true },
              },
            },
          },
        },
      });
    });

    return successResponse(staff, 201);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("POST /api/admin/staff error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการสร้างพนักงาน", 500);
  }
}
