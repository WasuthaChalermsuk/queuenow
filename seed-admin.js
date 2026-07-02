/**
 * ============================================
 * QueueNow — Seed Admin User
 * ============================================
 *
 * วิธีใช้งาน:
 *   node seed-admin.js
 *
 * สร้าง admin user:
 *   username: admin
 *   password: admin123
 *   role:     SUPER_ADMIN
 *
 * ใช้ crypto.pbkdf2Sync (Node.js built-in) เท่านั้น
 * ============================================
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

/**
 * Hash password ด้วย PBKDF2
 * Returns "hexSalt:hexHash"
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 QueueNow — Seed Admin User");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const passwordHash = hashPassword("admin123");

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin" },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      email: "admin",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const action = admin.createdAt.getTime() === admin.updatedAt.getTime()
    ? "✅ สร้าง admin user สำเร็จ"
    : "✅ อัปเดต admin user สำเร็จ (มีอยู่แล้ว)";

  console.log(action);
  console.log(`   ID:           ${admin.id}`);
  console.log(`   Email:        ${admin.email}`);
  console.log(`   Name:         ${admin.firstName} ${admin.lastName}`);
  console.log(`   Role:         ${admin.role}`);
  console.log(`   Active:       ${admin.isActive}`);
  console.log(`   Password:     admin123`);
  console.log(`   Password Hash: ${passwordHash.slice(0, 40)}...`);
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
