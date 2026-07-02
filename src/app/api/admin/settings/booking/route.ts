// ============================================
// GET/PUT /api/admin/settings/booking — ตั้งค่าการจอง
// จัดการ settings แบบ key-value ใน booking_settings table
// Keys: maxBookingsPerDay, maxBookingsPerHour, minHoursAdvance, maxDaysAdvance
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/auth";

// Default settings
const DEFAULT_SETTINGS: Record<string, string> = {
  maxBookingsPerDay: "100",
  maxBookingsPerHour: "10",
  minHoursAdvance: "1",
  maxDaysAdvance: "30",
};

const VALID_KEYS = [
  "maxBookingsPerDay",
  "maxBookingsPerHour",
  "minHoursAdvance",
  "maxDaysAdvance",
];

const bookingSettingsSchema = z.object({
  shopId: z.string().min(1, "กรุณาระบุร้านค้า"),
  settings: z
    .array(
      z.object({
        key: z.enum(VALID_KEYS as [string, ...string[]], {
          errorMap: () => ({ message: "คีย์การตั้งค่าไม่ถูกต้อง" }),
        }),
        value: z.string().min(1, "กรุณาระบุค่า"),
      })
    )
    .min(1, "กรุณาระบุการตั้งค่าอย่างน้อย 1 รายการ"),
});

// Validate numeric values
function validateSettingValue(key: string, value: string): string | null {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) {
    return `ค่าของ ${key} ต้องเป็นตัวเลขที่ไม่ติดลบ`;
  }
  switch (key) {
    case "maxBookingsPerDay":
      if (num < 1) return "จำนวนคิวสูงสุดต่อวันต้องมากกว่า 0";
      if (num > 10000) return "จำนวนคิวสูงสุดต่อวันห้ามเกิน 10,000";
      break;
    case "maxBookingsPerHour":
      if (num < 1) return "จำนวนคิวสูงสุดต่อชั่วโมงต้องมากกว่า 0";
      if (num > 500) return "จำนวนคิวสูงสุดต่อชั่วโมงห้ามเกิน 500";
      break;
    case "minHoursAdvance":
      if (num < 0) return "เวลาจองล่วงหน้าขั้นต่ำต้องไม่ติดลบ";
      if (num > 720) return "เวลาจองล่วงหน้าขั้นต่ำห้ามเกิน 720 ชั่วโมง";
      break;
    case "maxDaysAdvance":
      if (num < 1) return "วันจองล่วงหน้าสูงสุดต้องมากกว่า 0";
      if (num > 365) return "วันจองล่วงหน้าสูงสุดห้ามเกิน 365 วัน";
      break;
  }
  return null;
}

/**
 * GET — ดึงการตั้งค่าการจองปัจจุบัน
 * Query: ?shopId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);

    const { searchParams } = req.nextUrl;
    const shopId = session.shopId || searchParams.get("shopId");

    if (!shopId) {
      return errorResponse("กรุณาระบุ shopId", 400);
    }

    // ดึง settings ทั้งหมดของ shop
    const existingSettings = await prisma.bookingSetting.findMany({
      where: { shopId },
    });

    // Merge กับ default — ถ้าไม่มีใน DB ใช้ค่า default
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of existingSettings) {
      settingsMap[s.key] = s.value;
    }

    // แปลงเป็น array
    const settings = Object.entries(settingsMap).map(([key, value]) => ({
      key,
      value,
    }));

    return successResponse({
      shopId,
      settings,
    });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("GET /api/admin/settings/booking error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการดึงการตั้งค่า", 500);
  }
}

/**
 * PUT — อัปเดตการตั้งค่าการจอง
 */
export async function PUT(req: NextRequest) {
  try {
    const session = requireAuth(req);

    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("รูปแบบข้อมูลไม่ถูกต้อง", 400);
    }

    const parsed = bookingSettingsSchema.safeParse(body);
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

    const { shopId, settings } = parsed.data;

    // ตรวจสอบสิทธิ์
    if (
      session.shopId &&
      session.shopId !== shopId &&
      session.role !== "SUPER_ADMIN"
    ) {
      return errorResponse("ไม่มีสิทธิ์ในการจัดการร้านค้านี้", 403);
    }

    // ตรวจสอบว่า shop มีอยู่จริง
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
    if (!shop) {
      return errorResponse("ไม่พบร้านค้า", 404);
    }

    // Validate ค่า
    for (const setting of settings) {
      const error = validateSettingValue(setting.key, setting.value);
      if (error) {
        return errorResponse(error, 400);
      }
    }

    // Upsert settings ใน transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated: Array<{ key: string; value: string }> = [];

      for (const setting of settings) {
        await tx.bookingSetting.upsert({
          where: {
            shopId_key: {
              shopId,
              key: setting.key,
            },
          },
          create: {
            shopId,
            key: setting.key,
            value: setting.value,
            description: `ตั้งค่าการจอง: ${setting.key}`,
          },
          update: {
            value: setting.value,
          },
        });
        updated.push({ key: setting.key, value: setting.value });
      }

      return updated;
    });

    // ดึง settings ทั้งหมดหลังอัปเดต
    const existingSettings = await prisma.bookingSetting.findMany({
      where: { shopId },
    });

    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of existingSettings) {
      settingsMap[s.key] = s.value;
    }

    const allSettings = Object.entries(settingsMap).map(([key, value]) => ({
      key,
      value,
    }));

    return successResponse({
      message: "อัปเดตการตั้งค่าเรียบร้อย",
      settings: allSettings,
    });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return errorResponse((error as Error).message, 401);
    }
    console.error("PUT /api/admin/settings/booking error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า", 500);
  }
}
