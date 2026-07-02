# QueueNow — ระบบจองคิวออนไลน์ 🎯

**Built by KimDev Studio** | Next.js 14 + Prisma + Supabase

ระบบจัดการคิวอัจฉริยะสำหรับธุรกิจบริการทุกรูปแบบ — จองคิวสะดวก รวดเร็ว ไม่ต้องรอนาน

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **UI** | Tailwind CSS + shadcn/ui + Material Icons |
| **Validation** | Zod |
| **Dates** | date-fns |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **Theme** | Dark-first with next-themes |

---

## 📁 Project Structure

```
queuenow/
├── prisma/
│   └── schema.prisma          # Database schema (12 tables)
├── src/
│   ├── app/
│   │   ├── (public)/           # Public routes
│   │   │   ├── layout.tsx
│   │   │   ├── queue/          # จองคิว
│   │   │   └── track/          # ติดตามคิว
│   │   ├── admin/              # Admin panel
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   ├── bookings/
│   │   │   ├── staff/
│   │   │   ├── services/
│   │   │   └── settings/
│   │   ├── layout.tsx          # Root layout (Thai font)
│   │   ├── page.tsx            # Homepage
│   │   └── globals.css         # Dark theme + styles
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── utils.ts            # cn(), formatters
│   │   ├── validations.ts      # Zod schemas
│   │   ├── types.ts            # TypeScript types
│   │   └── hooks/              # Custom React hooks
├── .env.example                # Environment variables template
├── components.json             # shadcn/ui config
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## 🗄️ Database Schema

12 tables (Prisma with PostgreSQL):

| # | Table | Description |
|---|-------|-------------|
| 1 | `shops` | ร้านค้า/สาขา |
| 2 | `services` | บริการ |
| 3 | `staff` | พนักงาน |
| 4 | `staff_services` | บริการที่พนักงานทำได้ (M:N) |
| 5 | `shop_hours` | เวลาทำการ |
| 6 | `break_times` | เวลาพัก |
| 7 | `customers` | ลูกค้า |
| 8 | `bookings` | การจองคิว (status: PENDING→COMPLETED) |
| 9 | `booking_status_logs` | ประวัติเปลี่ยนสถานะ |
| 10 | `admin_users` | ผู้ดูแลระบบ (roles: SUPER_ADMIN, SHOP_ADMIN, STAFF) |
| 11 | `booking_settings` | ตั้งค่าการจอง |
| 12 | `special_holidays` | วันหยุดพิเศษ |

---

## 🏃 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Setup database
```bash
npx prisma generate
npx prisma db push
# or: npx prisma migrate dev --name init
```

### 4. Run development server
```bash
npm run dev
# → http://localhost:3000
```

### 5. Open Prisma Studio (DB GUI)
```bash
npm run prisma:studio
```

---

## 🎨 Design System

- **Theme**: Dark-first (light mode supported)
- **Primary Color**: Electric Blue `#3B82F6`
- **Font**: Noto Sans Thai (รองรับภาษาไทยเต็มรูปแบบ)
- **Icons**: Material Symbols (Google Fonts)
- **Radius**: `0.75rem` (rounded-xl)
- **Shadows**: Elevated dark theme shadows

---

## 📝 License

© 2026 KimDev Studio. All rights reserved.
