// ============================================
// GET + POST /api/admin/services — รายการบริการ + สร้างใหม่
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

// Schema สำหรับสร้าง/อัปเดต service
const serviceSchema = z.object({
  shopId: z.string().min(1, "กรุณาระบุร้านค้า").optional(),
  name: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().int().min(1, "ระยะเวลาต้องมากกว่า 0 นาที"),
  price: z.number().min(0, "ราคาต้องไม่ติดลบ").optional(),
  color: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET — ดึงรายการบริการทั้งหมด (รวม inactive) สำหรับ admin
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

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        shop: { select: { id: true, name: true, code: true } },
        _count: {
          select: { bookings: true, staffServices: true },
        },
      },
    });

    return successResponse(services);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/services error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงรายการบริการ", 500);
  }
}

/**
 * POST — สร้างบริการใหม่
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

    const parsed = serviceSchema.safeParse(body);
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

    // 🔧 L6: ถ้าไม่มี shopId ใน body → ใช้จาก session
    const shopId = data.shopId || session.shopId;
    if (!shopId) {
      return errorResponse("กรุณาระบุร้านค้า (shopId)", 400);
    }

    // ตรวจสอบสิทธิ์
    if (session.shopId && session.shopId !== shopId && session.role !== "SUPER_ADMIN") {
      return errorResponse("ไม่มีสิทธิ์ในการจัดการร้านค้านี้", 403);
    }

    // ตรวจสอบว่า shop มีอยู่จริง
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
    if (!shop) {
      return errorResponse("ไม่พบร้านค้า", 404);
    }

    const service = await prisma.service.create({
      data: {
        shopId,
        name: data.name,
        nameEn: data.nameEn || null,
        description: data.description || null,
        duration: data.duration,
        price: data.price ?? null,
        color: data.color || "#3b82f6",
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    return successResponse(service, 201);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("POST /api/admin/services error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการสร้างบริการ", 500);
  }
}
