// ============================================
// POST /api/bookings — สร้างการจองคิวใหม่
// ============================================
import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/auth";
import { createBookingSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Generate unique booking number: BK-YYMMDD-UUID6
 * ใช้ crypto.randomUUID() ป้องกัน collision
 */
function generateBookingNumber(): string {
  const now = new Date();
  const datePart =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const uuidPart = crypto.randomUUID().split("-")[0].toUpperCase();
  return `BK-${datePart}-${uuidPart}`;
}

/**
 * Retry booking creation if booking number collides (rare)
 */
async function createBookingWithRetry(
  input: ReturnType<typeof createBookingSchema.parse>,
  servicePrice: number | null,
  maxRetries = 3
): Promise<{ booking: unknown; customerId: string }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const bookingNumber = generateBookingNumber();
      const bookingDateObj = new Date(input.bookingDate + "T00:00:00.000Z");

      const result = await prisma.$transaction(
        async (tx) => {
        // ============================================
        // H1: Availability check ใน transaction — ป้องกัน race condition

        const txService = await tx.service.findUnique({
          where: { id: input.serviceId },
          select: { duration: true },
        });
        if (!txService) throw new AvailabilityError("ไม่พบบริการ");

        const duration = txService.duration;

        // นับ bookings ที่มีอยู่ใน slot นี้
        const existingCount = await tx.booking.count({
          where: {
            shopId: input.shopId,
            bookingDate: {
              gte: new Date(input.bookingDate + "T00:00:00.000Z"),
              lt: new Date(input.bookingDate + "T23:59:59.999Z"),
            },
            timeSlot: input.timeSlot,
            status: { in: ["PENDING", "CONFIRMED", "ARRIVED", "SERVING"] },
          },
        });

        // ตรวจสอบ shop hours
        const dayMap: Record<number, string> = {
          0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
          4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
        };
        const date = new Date(input.bookingDate + "T00:00:00.000Z");
        const dayOfWeek = dayMap[date.getUTCDay()];

        const shopHour = await tx.shopHour.findUnique({
          where: { shopId_dayOfWeek: { shopId: input.shopId, dayOfWeek } },
        });

        if (!shopHour || shopHour.isClosed) {
          throw new AvailabilityError("ร้านปิดทำการในวันนี้");
        }

        const maxPerSlot = shopHour.maxBookingsPerSlot || 5;
        if (existingCount >= maxPerSlot) {
          throw new AvailabilityError("คิวเต็มสำหรับเวลานี้");
        }

        // ตรวจสอบพนักงาน (ถ้าระบุ)
        if (input.staffId) {
          const staffBookings = await tx.booking.count({
            where: {
              staffId: input.staffId,
              bookingDate: {
                gte: new Date(input.bookingDate + "T00:00:00.000Z"),
                lt: new Date(input.bookingDate + "T23:59:59.999Z"),
              },
              timeSlot: input.timeSlot,
              status: { in: ["PENDING", "CONFIRMED", "ARRIVED", "SERVING"] },
            },
          });

          const staff = await tx.staff.findUnique({
            where: { id: input.staffId },
            select: { maxConcurrentBookings: true, isActive: true },
          });

          if (!staff?.isActive) {
            throw new AvailabilityError("พนักงานนี้ไม่พร้อมให้บริการ");
          }

          const maxConcurrent = staff.maxConcurrentBookings || 1;
          if (staffBookings >= maxConcurrent) {
            throw new AvailabilityError("พนักงานมีคิวเต็มสำหรับเวลานี้");
          }

          // ตรวจสอบว่า staff มี break ในช่วงนี้หรือไม่
          const slotStartMin = (() => {
            const [h, m] = input.timeSlot.split(":").map(Number);
            return h * 60 + m;
          })();
          const slotEndMin = slotStartMin + duration;

          const breaks = await tx.breakTime.findMany({
            where: {
              staffId: input.staffId,
              OR: [
                {
                  isRecurring: false,
                  startTime: { gte: new Date(input.bookingDate + "T00:00:00.000Z") },
                  endTime: { lt: new Date(input.bookingDate + "T23:59:59.999Z") },
                },
                { isRecurring: true, dayOfWeek },
              ],
            },
          });

          for (const b of breaks) {
            const bStart = new Date(b.startTime);
            const bEnd = new Date(b.endTime);
            const breakStartMin = bStart.getUTCHours() * 60 + bStart.getUTCMinutes();
            const breakEndMin = bEnd.getUTCHours() * 60 + bEnd.getUTCMinutes();
            if (slotStartMin < breakEndMin && slotEndMin > breakStartMin) {
              throw new AvailabilityError("พนักงานอยู่ในช่วงพัก");
            }
          }
        }

        // ============================================
        // ผ่าน availability check → สร้าง booking
        // ============================================

        // Find or create customer (inside tx for consistency)
        let cust = null;
        if (input.customer.phone) {
          cust = await tx.customer.findFirst({
            where: { phone: input.customer.phone },
          });
        }
        if (!cust && input.customer.email) {
          cust = await tx.customer.findFirst({
            where: { email: input.customer.email },
          });
        }
        if (!cust) {
          cust = await tx.customer.create({
            data: {
              firstName: input.customer.firstName,
              lastName: input.customer.lastName,
              phone: input.customer.phone || null,
              email: input.customer.email || null,
            },
          });
        }

        // 🔧 M2: คำนวณ queuePosition หลังสร้าง booking — ป้องกัน race condition
        // โดยนับ bookings ทั้งหมดในวันนั้น (รวมที่เพิ่งสร้าง) ภายใน transaction เดียวกัน
        const booking = await tx.booking.create({
          data: {
            shopId: input.shopId,
            customerId: cust.id,
            serviceId: input.serviceId,
            staffId: input.staffId || null,
            bookingNumber,
            bookingDate: bookingDateObj,
            timeSlot: input.timeSlot,
            status: "PENDING",
            queuePosition: 0, // ← จะอัปเดตหลังสร้าง
            totalPrice: servicePrice,
            notes: input.notes || null,
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                color: true,
              },
            },
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nickname: true,
                color: true,
              },
            },
            shop: {
              select: {
                id: true,
                name: true,
                code: true,
                address: true,
                phone: true,
              },
            },
          },
        });

        // 🔧 M2: คำนวณ queuePosition หลังสร้าง — นับ booking ทั้งหมดในวันเดียวกัน (รวมที่เพิ่งสร้าง)
        const position = await tx.booking.count({
          where: {
            shopId: input.shopId,
            bookingDate: {
              gte: new Date(input.bookingDate + "T00:00:00.000Z"),
              lt: new Date(input.bookingDate + "T23:59:59.999Z"),
            },
          },
        });

        // อัปเดต queuePosition
        await tx.booking.update({
          where: { id: booking.id },
          data: { queuePosition: position },
        });

        // บันทึก log สถานะ
        await tx.bookingStatusLog.create({
          data: {
            bookingId: booking.id,
            toStatus: "PENDING",
            changedBy: "system",
            note: "สร้างการจองผ่านระบบ",
          },
        });

        // 🔧 M2: คืนค่า booking พร้อม queuePosition ที่ถูกต้อง
        return {
          booking: { ...booking, queuePosition: position },
          customerId: cust.id,
        };
      }, { timeout: 20000, maxWait: 10000 });

      return result;

    } catch (error) {
      // Re-throw availability errors immediately (ไม่ใช่ collision)
      if (error instanceof AvailabilityError) throw error;

      // Retry on unique constraint violation (booking number collision)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        lastError = error;
        continue;
      }

      // For other errors, if it's a unique constraint in normal Error form
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
}

// Custom error for availability failures (used inside transaction)
class AvailabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityError";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ---------- Validate input ----------
    let input;
    try {
      input = createBookingSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        return errorResponse(
          "ข้อมูลไม่ถูกต้อง",
          400,
          err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          }))
        );
      }
      throw err;
    }

    // ---------- Verify shop ----------
    const shop = await prisma.shop.findUnique({
      where: { id: input.shopId, isActive: true },
    });
    if (!shop) {
      return errorResponse("ไม่พบร้านค้าหรือร้านค้าปิดให้บริการ", 404);
    }

    // ---------- Verify service ----------
    const service = await prisma.service.findUnique({
      where: { id: input.serviceId, isActive: true, shopId: input.shopId },
    });
    if (!service) {
      return errorResponse("ไม่พบบริการหรือบริการนี้ไม่เปิดให้บริการ", 404);
    }

    // ---------- Verify staff (optional) ----------
    if (input.staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: input.staffId, isActive: true, shopId: input.shopId },
      });
      if (!staff) {
        return errorResponse("ไม่พบพนักงานหรือพนักงานไม่พร้อมให้บริการ", 404);
      }

      // Check staff can do this service
      const staffService = await prisma.staffService.findUnique({
        where: {
          staffId_serviceId: {
            staffId: input.staffId,
            serviceId: input.serviceId,
          },
        },
      });
      if (!staffService) {
        return errorResponse("พนักงานนี้ไม่สามารถให้บริการนี้ได้", 400);
      }
    }

    // ---------- Create booking (availability check inside transaction) ----------
    const result = await createBookingWithRetry(input, service.price || null);

    return successResponse(result.booking, 201);
  } catch (error) {
    console.error("POST /api/bookings error:", error);

    if (error instanceof AvailabilityError) {
      return errorResponse(error.message, 409);
    }

    return errorResponse(`เกิดข้อผิดพลาดในการสร้างการจอง: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}
