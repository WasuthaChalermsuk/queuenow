// ============================================
// GET + POST /api/admin/settings/holidays — จัดการวันหยุดพิเศษ
// GET: รายการวันหยุด (filter ตาม shopId, ปี)
// POST: เพิ่มวันหยุด { shopId, name, date, isFullDay?, startTime?, endTime?, description? }
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

const timeRegex = /^\d{2}:\d{2}$/;

const createHolidaySchema = z.object({
  shopId: z.string().min(1, "กรุณาระบุร้านค้า"),
  name: z.string().min(1, "กรุณากรอกชื่อวันหยุด"),
  date: z.string().min(1, "กรุณาระบุวันที่"),
  isFullDay: z.boolean().optional().default(true),
  startTime: z
    .string()
    .regex(timeRegex, "รูปแบบเวลาเริ่มไม่ถูกต้อง (HH:mm)")
    .optional(),
  endTime: z
    .string()
    .regex(timeRegex, "รูปแบบเวลาสิ้นสุดไม่ถูกต้อง (HH:mm)")
    .optional(),
  description: z.string().max(500, "รายละเอียดห้ามเกิน 500 ตัวอักษร").optional(),
});

/**
 * GET — ดึงรายการวันหยุดพิเศษ
 * Query: ?shopId=xxx&year=2026&page=1&limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);

    const { searchParams } = req.nextUrl;
    const shopId = session.shopId || searchParams.get("shopId");
    const year = searchParams.get("year");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    if (!shopId) {
      return errorResponse("กรุณาระบุ shopId", 400);
    }

    // สร้าง where clause
    const where: Record<string, unknown> = { shopId };

    if (year) {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return errorResponse("ปีไม่ถูกต้อง", 400);
      }
      where.date = {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${yearNum + 1}-01-01T00:00:00.000Z`),
      };
    }

    const [holidays, total] = await Promise.all([
      prisma.specialHoliday.findMany({
        where,
        orderBy: { date: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          shop: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.specialHoliday.count({ where }),
    ]);

    return successResponse({
      holidays,
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
    console.error("GET /api/admin/settings/holidays error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงรายการวันหยุด", 500);
  }
}

/**
 * POST — เพิ่มวันหยุดพิเศษ
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAuth(req);

    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("รูปแบบข้อมูลไม่ถูกต้อง", 400);
    }

    const parsed = createHolidaySchema.safeParse(body);
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
    if (
      session.shopId &&
      session.shopId !== data.shopId &&
      session.role !== "SUPER_ADMIN"
    ) {
      return errorResponse("ไม่มีสิทธิ์ในการจัดการร้านค้านี้", 403);
    }

    // ตรวจสอบว่า shop มีอยู่จริง
    const shop = await prisma.shop.findUnique({
      where: { id: data.shopId },
    });
    if (!shop) {
      return errorResponse("ไม่พบร้านค้า", 404);
    }

    // ตรวจสอบรูปแบบวันที่
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      return errorResponse("รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)", 400);
    }

    // ถ้าไม่ fullDay ต้องระบุเวลา
    if (!data.isFullDay) {
      if (!data.startTime || !data.endTime) {
        return errorResponse(
          "กรุณาระบุเวลาเริ่มและเวลาสิ้นสุดสำหรับวันหยุดที่ไม่เต็มวัน",
          400
        );
      }
    }

    const holiday = await prisma.specialHoliday.create({
      data: {
        shopId: data.shopId,
        name: data.name,
        date: new Date(data.date + "T00:00:00.000Z"),
        isFullDay: data.isFullDay ?? true,
        startTime: data.isFullDay ? null : (data.startTime || null),
        endTime: data.isFullDay ? null : (data.endTime || null),
        description: data.description || null,
      },
      include: {
        shop: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(
      {
        message: "เพิ่มวันหยุดเรียบร้อย",
        holiday,
      },
      201
    );
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("POST /api/admin/settings/holidays error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการเพิ่มวันหยุด", 500);
  }
}
