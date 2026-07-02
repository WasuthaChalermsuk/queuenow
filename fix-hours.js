
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst({ where: { code: 'KIMDEV' } });
  if (!shop) { console.log('No shop'); return; }

  // Delete old hours
  await prisma.shopHour.deleteMany({ where: { shopId: shop.id } });

  const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  for (const day of days) {
    await prisma.shopHour.create({
      data: {
        shopId: shop.id,
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '20:00',
        isClosed: false,
      }
    });
  }
  console.log('Fixed: 7 days with proper day names');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
