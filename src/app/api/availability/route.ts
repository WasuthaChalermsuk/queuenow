// ============================================
// GET /api/availability — คำนวณเวลาว่าง (slot ที่จองได้)
// Query: ?date=YYYY-MM-DD&shopId=&serviceId=&staffId=
// ============================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";

// Mapping วันที่ JS (0=Sun) → DayOfWeek string
const DAY_MAP: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

interface AvailabilitySlot {
  time: string;       // "09:00"
  available: boolean;
  remainingSlots: number;
  maxSlots: number;
  staffAvailable: number;
}

/**
 * แปลง "HH:mm" → นาทีรวม (เช่น "09:00" → 540)
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * แปลงนาทีรวม → "HH:mm"
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * ตรวจสอบว่า break time ทับกับช่วงเวลาที่ระบุหรือไม่
 */
function overlapsBreak(
  slotStart: number,
  slotEnd: number,
  breaks: { startMinutes: number; endMinutes: number }[]
): boolean {
  return breaks.some(
    (b) => slotStart < b.endMinutes && slotEnd > b.startMinutes
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const dateStr = searchParams.get("date");
    const shopId = searchParams.get("shopId");
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");

    // ---------- Validate inputs ----------
    if (!dateStr) {
      return errorResponse("กรุณาระบุวันที่ (date=YYYY-MM-DD)");
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return errorResponse("รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)");
    }

    const bookingDate = new Date(dateStr + "T00:00:00.000Z");
    if (isNaN(bookingDate.getTime())) {
      return errorResponse("วันที่ไม่ถูกต้อง");
    }

    // ห้ามจองวันที่ผ่านมาแล้ว
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return errorResponse("ไม่สามารถจองวันที่ผ่านมาแล้วได้");
    }

    // ---------- Get shop ----------
    let shop;
    if (shopId) {
      shop = await prisma.shop.findUnique({
        where: { id: shopId, isActive: true },
      });
    } else {
      shop = await prisma.shop.findFirst({ where: { isActive: true } });
    }

    if (!shop) {
      return errorResponse("ไม่พบข้อมูลร้านค้า", 404);
    }

    // ---------- Get service (for duration) ----------
    let serviceDuration = 30; // default 30 min
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId, isActive: true, shopId: shop.id },
      });
      if (!service) {
        return errorResponse("ไม่พบบริการที่ระบุ", 404);
      }
      serviceDuration = service.duration;
    }

    // ---------- Get shop hours for this day ----------
    const dayOfWeek = DAY_MAP[bookingDate.getUTCDay()];
    const shopHour = await prisma.shopHour.findUnique({
      where: { shopId_dayOfWeek: { shopId: shop.id, dayOfWeek } },
    });

    if (!shopHour || shopHour.isClosed) {
      // ร้านปิดวันนี้
      return successResponse({
        date: dateStr,
        dayOfWeek,
        isClosed: true,
        slots: [],
        message: "ร้านปิดทำการในวันนี้",
      });
    }

    const openMinutes = timeToMinutes(shopHour.openTime);
    const closeMinutes = timeToMinutes(shopHour.closeTime);
    const slotDuration = shopHour.slotDuration || 15;
    const maxBookingsPerSlot = shopHour.maxBookingsPerSlot || shop.maxQueuePerSlot;

    // ---------- Check special holidays ----------
    const holiday = await prisma.specialHoliday.findFirst({
      where: {
        shopId: shop.id,
        date: {
          gte: new Date(dateStr + "T00:00:00.000Z"),
          lt: new Date(dateStr + "T23:59:59.999Z"),
        },
      },
    });

    if (holiday?.isFullDay) {
      return successResponse({
        date: dateStr,
        dayOfWeek,
        isClosed: true,
        holidayName: holiday.name,
        slots: [],
        message: `ร้านหยุด: ${holiday.name}`,
      });
    }

    // ---------- Get staff break times ----------
    let staffBreaks: { startMinutes: number; endMinutes: number }[] = [];
    if (staffId) {
      const breakTimes = await prisma.breakTime.findMany({
        where: {
          staffId,
          OR: [
            // non-recurring: breaks on this date
            {
              isRecurring: false,
              startTime: { gte: new Date(dateStr + "T00:00:00.000Z") },
              endTime: { lt: new Date(dateStr + "T23:59:59.999Z") },
            },
            // recurring: breaks on this day of week
            {
              isRecurring: true,
              dayOfWeek,
            },
          ],
        },
      });

      staffBreaks = breakTimes.map((b) => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return {
          startMinutes: start.getUTCHours() * 60 + start.getUTCMinutes(),
          endMinutes: end.getUTCHours() * 60 + end.getUTCMinutes(),
        };
      });
    }

    // ---------- Get existing bookings (PENDING + CONFIRMED) ----------
    const bookingWhere: Record<string, unknown> = {
      shopId: shop.id,
      bookingDate: {
        gte: new Date(dateStr + "T00:00:00.000Z"),
        lt: new Date(dateStr + "T23:59:59.999Z"),
      },
      status: { in: ["PENDING", "CONFIRMED", "ARRIVED", "SERVING"] },
    };
    if (staffId) bookingWhere.staffId = staffId;

    const existingBookings = await prisma.booking.findMany({
      where: bookingWhere,
      select: { timeSlot: true, staffId: true },
    });

    // Group bookings by timeSlot → count per slot
    const slotBookingCount: Record<string, number> = {};
    // Group bookings by staffId+timeSlot → for staff-level availability
    const staffSlotBookingSet = new Set<string>();
    for (const b of existingBookings) {
      slotBookingCount[b.timeSlot] = (slotBookingCount[b.timeSlot] || 0) + 1;
      if (b.staffId) {
        staffSlotBookingSet.add(`${b.staffId}:${b.timeSlot}`);
      }
    }

    // 🔧 M6: ดึงข้อมูล staff breaks ทั้งหมด (ทุกคน) เพื่อนับ staff ที่ว่างจริง
    let allStaffBreaksMap: Map<string, { startMinutes: number; endMinutes: number }[]> = new Map();
    const allStaff = await prisma.staff.findMany({
      where: { shopId: shop.id, isActive: true },
      select: { id: true },
    });

    const allBreakTimes = await prisma.breakTime.findMany({
      where: {
        staffId: { in: allStaff.map((s) => s.id) },
        OR: [
          {
            isRecurring: false,
            startTime: { gte: new Date(dateStr + "T00:00:00.000Z") },
            endTime: { lt: new Date(dateStr + "T23:59:59.999Z") },
          },
          {
            isRecurring: true,
            dayOfWeek,
          },
        ],
      },
    });

    for (const bt of allBreakTimes) {
      if (!allStaffBreaksMap.has(bt.staffId)) {
        allStaffBreaksMap.set(bt.staffId, []);
      }
      const start = new Date(bt.startTime);
      const end = new Date(bt.endTime);
      allStaffBreaksMap.get(bt.staffId)!.push({
        startMinutes: start.getUTCHours() * 60 + start.getUTCMinutes(),
        endMinutes: end.getUTCHours() * 60 + end.getUTCMinutes(),
      });
    }

    // ---------- Generate slots ----------
    const slots: AvailabilitySlot[] = [];

    for (
      let slotStart = openMinutes;
      slotStart + serviceDuration <= closeMinutes;
      slotStart += slotDuration
    ) {
      const slotTime = minutesToTime(slotStart);
      const slotEnd = slotStart + serviceDuration;

      // Check break time overlap
      const isDuringBreak = overlapsBreak(slotStart, slotEnd, staffBreaks);

      // Check holiday partial closure
      let isDuringHolidayPartial = false;
      if (holiday && !holiday.isFullDay && holiday.startTime && holiday.endTime) {
        const hStart = timeToMinutes(holiday.startTime);
        const hEnd = timeToMinutes(holiday.endTime);
        if (slotStart < hEnd && slotEnd > hStart) {
          isDuringHolidayPartial = true;
        }
      }

      const bookedCount = slotBookingCount[slotTime] || 0;
      const remainingSlots = Math.max(0, maxBookingsPerSlot - bookedCount);

      // 🔧 M6: คำนวณจำนวน staff ที่ว่างจริง (ไม่ติดพัก และไม่ติดคิวอื่น)
      let availableStaffCount = 0;
      if (staffId) {
        // กรณีระบุ staffId — check break + check ไม่มี booking ใน slot นี้
        const staffBooked = staffSlotBookingSet.has(`${staffId}:${slotTime}`);
        availableStaffCount = (!isDuringBreak && !staffBooked) ? 1 : 0;
      } else {
        // 🔧 M6: นับ staff ทุกคนที่ว่างใน slot นี้
        for (const s of allStaff) {
          const staffBreaksList = allStaffBreaksMap.get(s.id) || [];
          const onBreak = staffBreaksList.some(
            (b) => slotStart < b.endMinutes && slotEnd > b.startMinutes
          );
          const staffBooked = staffSlotBookingSet.has(`${s.id}:${slotTime}`);
          if (!onBreak && !staffBooked) {
            availableStaffCount++;
          }
        }
      }

      const isAvailable =
        !isDuringHolidayPartial &&
        remainingSlots > 0 &&
        availableStaffCount > 0;

      slots.push({
        time: slotTime,
        available: isAvailable,
        remainingSlots,
        maxSlots: maxBookingsPerSlot,
        staffAvailable: availableStaffCount,
      });
    }

    return successResponse({
      date: dateStr,
      dayOfWeek,
      isClosed: false,
      openTime: shopHour.openTime,
      closeTime: shopHour.closeTime,
      slotDuration,
      serviceDuration,
      slots,
    });
  } catch (error) {
    console.error("GET /api/availability error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการคำนวณเวลาว่าง", 500);
  }
}
