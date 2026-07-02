
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

async function main() {
  // Shop
  const shop = await prisma.shop.create({
    data: {
      name: 'KimDev Studio Barbershop',
      code: 'KIMDEV',
      description: 'ร้านตัดผมอันดับ 1 — จองคิวออนไลน์ สะดวก รวดเร็ว',
      phone: '081-234-5678',
      address: '123 ถนนสุขุมวิท กรุงเทพฯ',
      maxQueuePerSlot: 3,
    }
  });
  console.log('Shop: ' + shop.id);

  // Services
  const svcs = [
    { name: 'ตัดผมชาย', price: 300, duration: 30, color: '#3b82f6', sortOrder: 1 },
    { name: 'ตัดผมทรงรอง', price: 350, duration: 40, color: '#8b5cf6', sortOrder: 2 },
    { name: 'สระ+ไดร์+เซ็ทผม', price: 400, duration: 45, color: '#ec4899', sortOrder: 3 },
    { name: 'ยืดผมชาย', price: 800, duration: 90, color: '#f59e0b', sortOrder: 4 },
    { name: 'ทำสีผม', price: 1200, duration: 120, color: '#ef4444', sortOrder: 5 },
  ];
  const services = [];
  for (const s of svcs) {
    services.push(await prisma.service.create({ data: { ...s, shopId: shop.id } }));
  }
  console.log('Services: ' + services.length);

  // Staff
  const staffData = [
    { firstName: 'ช่าง', lastName: 'หนึ่ง', nickname: 'หนึ่ง', color: '#3b82f6' },
    { firstName: 'ช่าง', lastName: 'สอง', nickname: 'สอง', color: '#8b5cf6' },
    { firstName: 'ช่าง', lastName: 'สาม', nickname: 'สาม', color: '#ec4899' },
  ];
  for (const s of staffData) {
    const st = await prisma.staff.create({ data: { ...s, shopId: shop.id } });
    for (const svc of services.slice(0, 4)) {
      await prisma.staffService.create({ data: { staffId: st.id, serviceId: svc.id } });
    }
  }
  console.log('Staff: 3');

  // Shop hours (9:00-20:00 every day)
  for (let day = 0; day < 7; day++) {
    await prisma.shopHour.create({
      data: { shopId: shop.id, dayOfWeek: String(day), openTime: '09:00', closeTime: '20:00', isClosed: false }
    });
  }
  console.log('Hours: 7 days');

  // Admin
  await prisma.adminUser.create({
    data: {
      shopId: shop.id, email: 'admin@kimdev.studio',
      passwordHash: hashPassword('admin123'),
      firstName: 'Admin', lastName: 'KimDev', role: 'SUPER_ADMIN',
    }
  });
  console.log('Admin: admin@kimdev.studio / admin123');
  console.log('DONE');
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
