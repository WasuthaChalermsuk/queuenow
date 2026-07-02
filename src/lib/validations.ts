import { z } from "zod";

// ============================================
// Booking Validation Schemas (Zod)
// ============================================

/**
 * Schema สำหรับการสร้างการจองใหม่
 */
export const createBookingSchema = z.object({
  shopId: z.string().uuid("รหัสร้านค้าไม่ถูกต้อง"),
  serviceId: z.string().uuid("รหัสบริการไม่ถูกต้อง"),
  staffId: z.string().uuid("รหัสพนักงานไม่ถูกต้อง").optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "รูปแบบเวลาไม่ถูกต้อง (HH:mm)"),
  customer: z.object({
    firstName: z.string().min(1, "กรุณากรอกชื่อ"),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
    phone: z
      .string()
      .regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง")
      .optional()
      .or(z.literal("")),
    email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  }),
  notes: z.string().max(500, "หมายเหตุห้ามเกิน 500 ตัวอักษร").optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Schema สำหรับการอัปเดตสถานะการจอง
 */
export const updateBookingStatusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "ARRIVED",
    "SERVING",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ]),
  note: z.string().max(500).optional(),
  cancelReason: z.string().max(500).optional(),
});

export type UpdateBookingStatusInput = z.infer<
  typeof updateBookingStatusSchema
>;

/**
 * Schema สำหรับ Admin Login
 */
export const adminLoginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/**
 * Schema สำหรับการค้นหาการจอง
 */
export const searchBookingSchema = z.object({
  bookingNumber: z.string().optional(),
  phone: z.string().optional(),
  date: z.string().optional(),
  status: z.string().optional(),
});

export type SearchBookingInput = z.infer<typeof searchBookingSchema>;

/**
 * Schema สำหรับตั้งค่าร้านค้า
 */
export const shopSettingsSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อร้าน"),
  phone: z.string().optional(),
  address: z.string().optional(),
  maxQueuePerSlot: z.number().min(1).max(50).optional(),
});

export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
