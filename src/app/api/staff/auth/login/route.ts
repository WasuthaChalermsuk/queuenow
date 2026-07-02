// ============================================
// POST /api/staff/auth/login — Staff Login
// เข้าสู่ระบบสำหรับพนักงาน (AdminUser role=STAFF)
// ============================================
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  createToken,
  verifyPassword,
} from "@/lib/auth";
import { AdminRole } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export async function POST(req: NextRequest) {
  try {
    // Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("รูปแบบข้อมูลไม่ถูกต้อง", 400);
    }

    const parsed = loginSchema.safeParse(body);
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

    const { email, password } = parsed.data;

    // ค้นหา admin user จาก email
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      return errorResponse("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
    }

    // เช็คว่าเป็น role ที่มีสิทธิ์เข้าใช้งาน (STAFF, SHOP_ADMIN, SUPER_ADMIN)
    if (!["STAFF", "SHOP_ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return errorResponse("ไม่มีสิทธิ์ในการเข้าใช้งาน", 403);
    }

    // ตรวจสอบรหัสผ่านด้วย PBKDF2
    const isValid = verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return errorResponse("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
    }

    // ค้นหา staff record ที่มี email ตรงกัน (สำหรับผูกกับ booking)
    let staffId: string | null = null;
    if (admin.shopId) {
      // 🔧 M5: ลองหา staff จาก email ก่อน
      let staff = await prisma.staff.findFirst({
        where: {
          shopId: admin.shopId,
          email: admin.email,
        },
        select: { id: true },
      });

      // 🔧 M5: ถ้าไม่เจอจาก email → fallback หาจาก firstName + lastName
      if (!staff) {
        staff = await prisma.staff.findFirst({
          where: {
            shopId: admin.shopId,
            firstName: admin.firstName,
            lastName: admin.lastName,
          },
          select: { id: true },
        });
      }

      staffId = staff?.id || null;
    }

    // สร้าง JWT token
    const token = createToken({
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role as AdminRole,
      shopId: admin.shopId,
      shopName: null,
    });

    // อัปเดต lastLoginAt
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return successResponse({
      token,
      staffId, // Staff record ID (ใช้สำหรับดึง booking)
      user: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        shopId: admin.shopId,
      },
    });
  } catch (error) {
    console.error("POST /api/staff/auth/login error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการเข้าสู่ระบบ", 500);
  }
}
