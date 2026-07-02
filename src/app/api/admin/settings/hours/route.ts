// ============================================
// PUT /api/admin/settings/hours — ตั้งค่าเวลาทำการของร้าน
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

const timeRegex = /^\d{2}:\d{2}$/;

const shopHourItemSchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
    "FRIDAY", "SATURDAY", "SUNDAY",
  ], { errorMap: () => ({ message: "วันที่ไม่ถูกต้อง" }) }),
  openTime: z.string().regex(timeRegex, "รูปแบบเวลาเปิดไม่ถูกต้อง (HH:mm)"),
  closeTime: z.string().regex(timeRegex, "รูปแบบเวลาปิดไม่ถูกต้อง (HH:mm)"),
  isClosed: z.boolean().optional(),
  slotDuration: z.number().int().min(5, "ระยะห่าง slot ต้องมากกว่า 5 นาที").max(120).optional(),
  maxBookingsPerSlot: z.number().int().min(1, "จำนวนคิวต่อ slot ต้องมากกว่า 0").max(100).optional(),
});

const setHoursSchema = z.object({
  shopId: z.string().min(1, "กรุณาระบุร้านค้า"),
  hours: z.array(shopHourItemSchema).min(1, "กรุณาระบุเวลาทำการ"),
});

/**
 * GET — ดึงเวลาทำการปัจจุบัน
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);

    const { searchParams } = req.nextUrl;
    const shopId = session.shopId || searchParams.get("shopId");

    if (!shopId) {
      return errorResponse("กรุณาระบุ shopId", 400);
    }

    const hours = await prisma.shopHour.findMany({
      where: { shopId },
      orderBy: [
        {
          dayOfWeek: "asc",
        },
      ],
    });

    return successResponse(hours);
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/settings/hours error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงเวลาทำการ", 500);
  }
}

/**
 * PUT — อัปเดตเวลาทำการ (replace ทั้งหมด)
 */
export async function PUT(req: NextRequest) {
  try {
    const session = requireAuth(req);

    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("รูปแบบข้อมูลไม่ถูกต้อง");
    }

    const parsed = setHoursSchema.safeParse(body);
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

    const { shopId, hours } = parsed.data;

    // 🔧 L5: ตรวจสอบว่า dayOfWeek ไม่ซ้ำกัน
    const dayOfWeeks = hours.map((h) => h.dayOfWeek);
    const uniqueDays = new Set(dayOfWeeks);
    if (uniqueDays.size !== dayOfWeeks.length) {
      return errorResponse("ไม่สามารถระบุวันซ้ำกันได้", 400);
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

    // ตรวจสอบว่าเวลาปิด > เวลาเปิด
    for (const h of hours) {
      if (!h.isClosed) {
        const openMin =
          parseInt(h.openTime.split(":")[0]) * 60 +
          parseInt(h.openTime.split(":")[1]);
        const closeMin =
          parseInt(h.closeTime.split(":")[0]) * 60 +
          parseInt(h.closeTime.split(":")[1]);
        if (closeMin <= openMin) {
          return errorResponse(
            `เวลาปิดต้องมากกว่าเวลาเปิด (${h.dayOfWeek}: ${h.openTime} - ${h.closeTime})`
          );
        }
      }
    }

    // อัปเดต/สร้าง shopHours ใน transaction
    const result = await prisma.$transaction(async (tx) => {
      // ลบของเก่าทั้งหมดก่อน
      await tx.shopHour.deleteMany({
        where: { shopId },
      });

      // สร้างใหม่
      await tx.shopHour.createMany({
        data: hours.map((h) => ({
          shopId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed ?? false,
          slotDuration: h.slotDuration ?? 15,
          maxBookingsPerSlot: h.maxBookingsPerSlot ?? 3,
        })),
      });

      // ดึงข้อมูลหลังอัปเดต
      return tx.shopHour.findMany({
        where: { shopId },
        orderBy: { dayOfWeek: "asc" },
      });
    });

    return successResponse({
      message: "อัปเดตเวลาทำการเรียบร้อย",
      hours: result,
    });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("PUT /api/admin/settings/hours error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการตั้งค่าเวลาทำการ", 500);
  }
}
