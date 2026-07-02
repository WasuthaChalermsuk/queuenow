// ============================================
// POST /api/admin/auth/login — Admin Login
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
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง").min(1, "กรุณากรอกชื่อผู้ใช้"),
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

    // ค้นหา admin user จาก username (ใช้ email field เป็น username)
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      return errorResponse("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
    }

    // ตรวจสอบรหัสผ่านด้วย PBKDF2
    const isValid = verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return errorResponse("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
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
    console.error("POST /api/admin/auth/login error:", error);
    return errorResponse("เกิดข้อผิดพลาดในการเข้าสู่ระบบ", 500);
  }
}
