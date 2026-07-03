# QueueNow Design System — Final Design Spec

> **ออกแบบโดย:** ดีไซน์ (KimDev Studio — Designer Agent)  
> **วันที่:** 4 กรกฎาคม 2569  
> **ใช้แทน:** UI/UX Design เดิม (1 ก.ค. 2569) ที่ใช้สี Indigo-Violet และ Amber/Gold ของ KimDev brand  
> **หลักการ:** QueueNow คือระบบจองคิว — **ไม่ใช่** KimDev Studio — จึงสมควรมีบุคลิกของตัวเอง

---

## 📐 Design Philosophy

### Core Identity

QueueNow = **Flow + Calm + Professional + Clean**

| Concept | Visual Translation |
|---------|-------------------|
| **Flow** (คิวที่ไหลลื่น) | Teal tones — the color of moving water, progress, continuity |
| **Calm** (ไม่เครียดเรื่องรอ) | Soft warm neutrals, generous whitespace, rounded forms |
| **Professional** (น่าเชื่อถือ) | Clean typography, consistent spacing, minimal decoration |
| **Clean** (สะอาด สบายตา) | Light-first, high contrast, uncluttered layouts |

### Design Principles

1. **Light-first by default** — Salon customers are general consumers, not developers. Clean white backgrounds feel more professional, accessible, and trustworthy for a service booking context. Dark mode available as preference.

2. **Mobile-first, not mobile-only** — Every screen designed for 375px first, then expanded. Touch targets ≥ 44px. Bottom-anchored primary actions (glass bar) for thumb reach.

3. **Calm over excitement** — No aggressive gradients, no neon, no urgency-red CTAs. The system should reduce queue anxiety, not amplify it.

4. **Minimal, not bare** — Clean doesn't mean empty. Use subtle warm tones, micro-interactions, and thoughtful whitespace to feel crafted, not stripped.

5. **Thai-first typography** — Noto Sans Thai throughout. Line-height and spacing optimized for Thai script readability.

---

## 🎨 Color System

### Why Teal? (เหตุผลที่เลือกสีเขียวน้ำทะเล)

| Factor | Analysis |
|--------|----------|
| **Psychology** | Teal = calm + trust + freshness. Combines blue's stability with green's growth. Scientifically proven to reduce stress perception — ideal for queue/waiting contexts. |
| **Context** | Salon/spa → cleanliness, freshness, water, renewal. Teal maps perfectly to these associations without being clinical. |
| **Differentiation** | Blue = generic SaaS (every startup). Amber = KimDev brand. Green = medical/clinical. Purple = premium/exclusive. Coral = too casual. **Teal is uniquely QueueNow.** |
| **Competition** | Booksy uses gold/black. Fresha uses green/white. StyleSeat uses coral. QueueNow = teal → immediately recognizable. |
| **Accessibility** | Teal on white passes WCAG AA at 14px+ (contrast ratio ≥ 4.5:1). Works in both light and dark modes. |
| **Thai market** | Teal has positive cultural associations (water = life, flow, cleanliness). Not associated with any negative context. |

### Primary Palette

```
PRIMARY — Deep Teal (สีเขียวน้ำทะเลเข้ม)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role              Hex         Tailwind        Usage
─────────────────────────────────────────────────
primary            #0F766E     teal-700        ปุ่มหลัก, ลิงก์, active states, CTA
primary-hover      #0D6B63     darker          hover บน primary
primary-light      #F0FDFA     teal-50         พื้นหลัง selected, highlighted row
primary-muted      #CCFBF1     teal-100        badge พื้นหลัง, tag, subtle accent bg
primary-content    #FFFFFF     white           ข้อความบนพื้น primary (ปุ่ม)
```

```
SURFACE — Warm Neutral (โทนอุ่น สบายตา)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role              Hex         Usage
─────────────────────────────────────────────────
background         #FAFAF9     พื้นหลังหลัก — warm white, ไม่เย็นชืดแบบ pure white
surface            #FFFFFF     การ์ด, modal, dropdown
surface-elevated   #F5F5F4     พื้นหลัง elevated (hover state, selected card)
surface-subtle     #FAF7F4     section background alternate (warm stone)
```

```
TEXT — Warm Dark Grays
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role              Hex         Usage
─────────────────────────────────────────────────
text-primary       #1C1917     ข้อความหลัก, headings (warm near-black)
text-secondary     #44403C     ข้อความรอง, descriptions, labels
text-tertiary      #78716C     placeholder, disabled, caption
text-inverse       #FAFAF9     ข้อความบนพื้นสีเข้ม
```

```
BORDER & DIVIDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role              Hex         Usage
─────────────────────────────────────────────────
border             #E7E5E4     เส้นขอบปกติ, dividers
border-light       #F0EFED     เส้นขอบบาง (inner card)
border-focus       #0F766E     focus ring (teal primary)
```

### Semantic Colors (ปรับให้เข้าโทน Teal)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role        Hex         Tailwind      Usage
─────────────────────────────────────────────
success      #059669     emerald-600   ยืนยันแล้ว, สำเร็จ
success-bg   #ECFDF5     emerald-50    bg success badge
warning      #D97706     amber-600     รอยืนยัน, แจ้งเตือน
warning-bg   #FFFBEB     amber-50      bg warning badge
danger       #DC2626     red-600       ปฏิเสธ, ลบ, error
danger-bg    #FEF2F2     red-50        bg danger badge
info         #0284C7     sky-600       ข้อมูล, ลิงก์ทั่วไป
info-bg      #F0F9FF     sky-50        bg info badge
```

### Queue Status Colors (สำคัญสำหรับระบบคิว)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status          Hex         Badge Style
────────────────────────────────────────────
PENDING          #D97706     amber — รอยืนยัน (warm, attention but not alarm)
CONFIRMED        #059669     emerald — ยืนยันแล้ว (positive, reassuring)
ARRIVED          #7C3AED     violet — มาถึงแล้ว (distinctive, action)
SERVING          #0F766E     teal — กำลังบริการ (primary brand color)
COMPLETED        #0891B2     cyan — เสร็จสิ้น (cool, calm closure)
CANCELLED        #DC2626     red — ยกเลิก (clear negative)
NO_SHOW          #78716C     warm gray — ไม่มา (muted, neutral)
```

### Dark Mode Palette

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role              Hex         Usage
─────────────────────────────────────────────────
background         #0C0D0F     พื้นหลังหลัก (warm near-black)
surface            #141517     การ์ด, modal
surface-elevated   #1A1C1E     hover, elevated
border             #27282B     เส้นขอบ

primary            #14B8A6     teal-500 (สว่างขึ้นสำหรับ dark bg)
primary-hover      #2DD4BF     teal-400 (hover)
primary-light      #042F2E     teal-950 (subtle bg)

text-primary       #FAFAF9     ข้อความหลัก
text-secondary     #A8A29E     ข้อความรอง
text-tertiary      #78716C     muted text
```

---

## 🔤 Typography

### Font Family

```
Display/Heading:  'Noto Sans Thai', sans-serif
Body:             'Noto Sans Thai', sans-serif
Mono (numbers):   'IBM Plex Sans Thai', 'Noto Sans Thai', sans-serif
Icons:            'Material Symbols Outlined' (Google Fonts CDN)
```

> **Why Noto Sans Thai?** เป็นฟอนต์ภาษาไทยที่ readability ดีที่สุดบนหน้าจอ ออกแบบโดย Google ร่วมกับ Cadson Demak (ไทย) ซัพพอร์ตทุกน้ำหนักตั้งแต่ 100-900 มี Thai looped และ loopless variants เหมาะกับทั้ง heading และ body

### Type Scale

```
Role            Size / Line-height    Weight    Usage
────────────────────────────────────────────────────────
display         40px / 1.1            700       Hero title (landing)
h1              32px / 1.2            700       Page title
h2              24px / 1.3            600       Section title
h3              20px / 1.3            600       Card title, sub-section
h4              18px / 1.4            600       Small heading
body-lg         18px / 1.6            400       Large body (landing)
body            16px / 1.6            400       Body text หลัก
body-sm         14px / 1.5            400       Secondary text, descriptions
caption         13px / 1.4            400       Captions, metadata
label           12px / 1.3            500       Labels, badges, buttons
overline        11px / 1.2            600       Section overline (uppercase)
```

### Thai Typography Rules

```
- letter-spacing: 0.01em (ชดเชยให้ภาษาไทยอ่านง่ายขึ้น)
- line-height: 1.6–1.75 (ภาษาไทยต้องการ line-height มากกว่าอังกฤษ ~10%)
- word-break: keep-all (ภาษาไทยไม่ตัดคำกลางบรรทัด)
- font-feature-settings: "rlig" 1, "calt" 1
```

---

## 📏 Spacing & Layout

### Spacing Scale (4px base)

```
space-0      0px
space-1      4px      tight gap (icon+text)
space-2      8px      inner padding
space-3      12px     compact gap
space-4      16px     standard padding, card padding
space-5      20px     relaxed padding
space-6      24px     section gap
space-8      32px     large gap
space-10     40px     section padding (mobile)
space-12     48px     section padding (tablet)
space-16     64px     section padding (desktop)
space-20     80px     hero padding
```

### Layout Grid

```
Mobile (< 640px):     full-width, px-4 (16px gutter)
Tablet (640-1024px):  max-w-2xl (672px), px-6, centered
Desktop (≥ 1024px):   max-w-5xl (1024px) หรือ max-w-7xl (1280px), centered
Admin Dashboard:      max-w-7xl (1280px), sidebar + main content
```

### Layout Principles

1. **Single-column on mobile** — No side-by-side layouts below 640px
2. **Bottom-anchored primary actions** — "ถัดไป", "ยืนยัน" always in fixed bottom bar
3. **Max content width 672px** for reading/booking flow — keeps line length comfortable
4. **Sticky headers** — Booking stepper and admin nav stay visible on scroll
5. **Generous vertical rhythm** — Sections separated by ≥ 32px, cards by ≥ 12px

---

## 🧩 Component Style Guide

### Buttons

```
Primary (filled):
  bg-primary (#0F766E), text-white, rounded-xl (12px), h-12 (48px), px-6
  hover: bg-primary-hover (#0D6B63)
  active: scale-[0.97]
  shadow: 0 4px 14px rgba(15, 118, 110, 0.25)
  font: 16px, weight 600
  → ใช้สำหรับ: CTA หลัก, "จองคิวเลย", "ยืนยัน", "ถัดไป"

Secondary (outlined):
  bg-transparent, border border-primary/30, text-primary
  hover: bg-primary-light (#F0FDFA), border-primary
  rounded-xl, h-12, px-6
  → ใช้สำหรับ: รองจาก primary, "ย้อนกลับ", "ดูทั้งหมด"

Ghost:
  bg-transparent, text-text-secondary
  hover: bg-surface-elevated (#F5F5F4), text-text-primary
  rounded-lg, h-10, px-4
  → ใช้สำหรับ: actions ใน card, toolbar, less important

Danger:
  bg-danger (#DC2626), text-white
  hover: bg-red-700
  → ใช้สำหรับ: "ยกเลิก", "ปฏิเสธ", "ลบ"

Icon Button:
  w-10 h-10, rounded-full
  hover: bg-surface-elevated
  grid place-items-center
  → ใช้สำหรับ: close, menu, toolbar icons
```

### Cards

```
Default Card:
  bg-white, border border-border (#E7E5E4), rounded-xl (12px), p-5
  shadow: 0 1px 3px rgba(0,0,0,0.04)
  hover (if interactive): border-primary/30, shadow-md, translateY(-1px)
  transition: 200ms ease

Selected Card:
  bg-primary-light (#F0FDFA), border-primary/40, border-l-[3px] border-l-primary
  → ใช้ accent left border แทนการเปลี่ยน bg ทั้ง card (cleaner)

Service Card (list view):
  Horizontal layout: [icon 48px] [name + description] [price + check]
  Full-width, touch-friendly height ≥ 64px

Dashboard Stats Card:
  Compact: [icon] [label] [value]
  bg-white, border, rounded-xl, p-4
  Min-width 140px for stat readability
```

### Inputs

```
Text Input:
  bg-white, border border-border (#E7E5E4), rounded-lg (10px), h-12, px-4
  placeholder: text-tertiary (#78716C)
  focus: border-primary (#0F766E), ring-2 ring-primary/15
  error: border-danger (#DC2626), ring-danger/15
  font: 16px (ป้องกัน iOS zoom)

Select / Dropdown:
  same styling as text input
  custom chevron icon (expand_more)

Textarea:
  same border/focus, min-h-[96px], rounded-lg
```

### Badges & Chips

```
Status Badge:
  inline-flex items-center gap-1.5
  px-2.5 py-1, rounded-full
  text-xs font-medium
  มี dot indicator 6px ก่อนข้อความ

  ตัวอย่าง:
  PENDING:    bg-warning-bg, text-warning, dot สี warning
  CONFIRMED:  bg-success-bg, text-success, dot สี success
  CANCELLED:  bg-danger-bg, text-danger, dot สี danger

Category Chip (filter):
  px-4 py-2, rounded-full, text-sm font-medium
  inactive: bg-surface-elevated, text-text-secondary
  active:   bg-primary, text-white

Queue Number Badge (large):
  ขนาดใหญ่สำหรับ display หมายเลขคิว
  bg-primary, text-white, text-2xl font-bold
  rounded-2xl, px-6 py-4, min-w-[120px]
  shadow-lg shadow-primary/20
```

### Stepper (ขั้นตอนการจอง)

```
Horizontal stepper สำหรับ booking flow:

  [1 ✓] ─── [2 ●] ─── [3 ○] ─── [4 ○]
  เลือก     วันเวลา    พนักงาน    ยืนยัน

Step Active (●):   bg-primary, text-white, w-8 h-8 rounded-full
Step Completed (✓): bg-success, text-white, check icon
Step Inactive (○):  bg-surface-elevated, text-tertiary, border
Connector line:      bg-border, h-[2px], flex-1
```

### Bottom Bar (Booking Flow)

```
Fixed bottom-0, full width, z-40
bg-white/90 backdrop-blur-lg (glass morphism)
border-t border-border
px-4 py-4

Layout: [summary text ซ้าย] [ปุ่ม action ขวา]
Summary: แสดง "เลือกแล้ว: บริการ xxx" หรือจำนวนขั้นตอน
Action: Primary button (ถัดไป/ยืนยัน)

Mobile: ปุ่ม full-width เมื่อ summary สั้นเกิน
```

### Modal / Dialog

```
Overlay: bg-black/40, backdrop-blur-sm
Modal: bg-white, rounded-2xl (16px), p-6, max-w-md
shadow-2xl
Animation: scale(0.95)→scale(1) + opacity 0→1, 200ms ease-out
```

### Empty States

```
Layout: centered, py-16
Icon: material symbol, 64px, text-border (muted)
Title: text-lg, text-text-secondary
Description: text-sm, text-tertiary
Optional CTA: secondary button

ตัวอย่าง:
  "ยังไม่มีบริการในขณะนี้"
  "ไม่พบการจองในวันที่เลือก"
```

### Loading / Skeleton

```
Skeleton base: bg-surface-elevated (ไม่ใช้ gray แบบ generic)
Animation: animate-pulse (opacity wave)
Card skeleton: same dimensions as real card, rounded-xl
Text skeleton: h-4 หรือ h-5, rounded, width 60-80%
```

### Toast / Notification

```
Position: top-right (desktop), top-center (mobile)
bg-white, border, rounded-xl, p-4, shadow-lg
Icon + message + optional action
Slide-in from top, auto-dismiss 4s

Variants:
  Success: bg-success-bg, border-success/20, icon check_circle
  Error:   bg-danger-bg, border-danger/20, icon error
  Warning: bg-warning-bg, border-warning/20, icon warning
  Info:    bg-info-bg, border-info/20, icon info
```

---

## 🖼️ Mood Board (Text-Based)

### Visual Direction: "Serene Flow"

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ความรู้สึกโดยรวม:
  เหมือนเดินเข้าร้านสปาไทยร่วมสมัย — สะอาด สงบ อบอุ่น
  อากาศเย็นเล็กน้อยจากแอร์ ได้กลิ่นน้ำมันหอมระเหยจางๆ
  ไม่รู้สึกเร่งรีบ — ทุกอย่างมีจังหวะของมัน
  การจองคิวไม่ใช่เรื่องเครียด แต่เป็นขั้นตอนสั้นๆ ที่น่าพอใจ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mood References:
  🌊 Ocean shallows at dawn — teal water over white sand
  🍃 Eucalyptus leaves against cream paper
  🪨 Smooth river stones — rounded, cool to touch
  ☁️ Morning mist over a calm lake
  🫧 Spa reception desk — teal towels, white orchids, bamboo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Texture & Material Feel:
  • Matte ceramic surfaces (cards, modals)
  • Linen / cotton weave (background warmth)
  • Glass with frosted edges (bottom bar, overlays)
  • Smooth pebble shapes (buttons, badges — rounded-xl)
  • Subtle water ripple micro-interactions (hover, transitions)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO:
  ✓ Clean white backgrounds with warm undertone
  ✓ Teal as the single hero color — restrained, confident
  ✓ Rounded corners (10-16px) — soft, approachable
  ✓ Generous whitespace — breathing room
  ✓ One clear CTA per screen — no decision paralysis
  ✓ Subtle shadows (ไม่ดำไม่หนัก) — depth without drama
  ✓ Progress indicators (stepper) — give sense of control

DON'T:
  ✗ Gradients — too SaaS-template
  ✗ Neon / electric colors — ขัดกับ calm
  ✗ Heavy drop shadows — ไม่ elegance
  ✗ Emoji as icons — unprofessional (ใช้ Material Icons)
  ✗ Centered hero sections — ใช้ left-aligned
  ✗ Multiple competing CTAs — one primary action per screen
  ✗ Pure black text (#000) — ใช้ warm near-black (#1C1917)
  ✗ KimDev amber/orange — นี่คือ QueueNow ไม่ใช่ KimDev

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Brand Voice in UI:
  "ไม่ต้องรอนาน" → แสดง wait time estimate
  "จองง่ายใน 1 นาที" → booking flow 4 ขั้นตอน หน้าละ 1 อย่าง
  "ไว้วางใจได้" → แสดงสถานะชัดเจน, confirmation ชัดเจน
  "เป็นมืออาชีพ" → typography สะอาด, spacing สม่ำเสมอ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Implementation Notes

### CSS Variables Migration

เปลี่ยนจาก Amber → Teal ใน `globals.css`:

```css
:root {
  /* Light Mode (default) */
  --background: 40 20% 98%;        /* #FAFAF9 */
  --foreground: 30 10% 10%;        /* #1C1917 */

  --card: 0 0% 100%;               /* #FFFFFF */
  --card-foreground: 30 10% 10%;

  --primary: 175 75% 26%;          /* #0F766E — Deep Teal */
  --primary-foreground: 0 0% 100%;

  --secondary: 30 10% 95%;         /* #F5F5F4 */
  --secondary-foreground: 30 10% 20%;

  --muted: 30 10% 95%;
  --muted-foreground: 30 6% 45%;   /* #78716C */

  --accent: 175 75% 26%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 72% 51%;        /* #DC2626 */
  --destructive-foreground: 0 0% 100%;

  --border: 30 10% 90%;            /* #E7E5E4 */
  --input: 30 10% 90%;
  --ring: 175 75% 26%;             /* Teal focus ring */

  --radius: 0.75rem;               /* 12px — keep current */

  /* Surface overrides */
  --surface-ground: #FAFAF9;
  --surface-card: #FFFFFF;
  --surface-overlay: #FFFFFF;
  --surface-border: #E7E5E4;
  --surface-hover: #F5F5F4;

  /* Brand tokens */
  --brand-primary: #0F766E;
  --brand-primary-hover: #0D6B63;
  --brand-primary-light: #F0FDFA;

  /* Status */
  --status-pending: #D97706;
  --status-confirmed: #059669;
  --status-arrived: #7C3AED;
  --status-serving: #0F766E;
  --status-completed: #0891B2;
  --status-cancelled: #DC2626;
  --status-no-show: #78716C;
}

.dark {
  --background: 0 0% 4%;           /* #0C0D0F */
  --foreground: 40 20% 98%;

  --card: 0 0% 8%;
  --card-foreground: 40 20% 98%;

  --primary: 175 70% 41%;          /* #14B8A6 */
  --primary-foreground: 0 0% 4%;

  --secondary: 0 0% 12%;
  --secondary-foreground: 40 20% 94%;

  --muted: 0 0% 15%;
  --muted-foreground: 30 6% 55%;

  --border: 0 0% 16%;
  --input: 0 0% 16%;
  --ring: 175 70% 41%;

  --surface-ground: #0C0D0F;
  --surface-card: #141517;
  --surface-overlay: #141517;
  --surface-border: #27282B;
  --surface-hover: #1A1C1E;

  --brand-primary: #14B8A6;
  --brand-primary-hover: #2DD4BF;
  --brand-primary-light: #042F2E;
}
```

### Tailwind Config Changes

```ts
// tailwind.config.ts — changes needed
colors: {
  // REMOVE: brand.50–950 (Amber scale) — this is KimDev brand
  // ADD:
  brand: {
    50:  "#F0FDFA",   // primary-light
    100: "#CCFBF1",   // primary-muted
    200: "#99F6E4",
    300: "#5EEAD4",
    400: "#2DD4BF",   // dark mode hover
    500: "#14B8A6",   // dark mode primary
    600: "#0D9488",
    700: "#0F766E",   // light mode primary
    800: "#115E59",
    900: "#134E4A",
    950: "#042F2E",   // dark mode subtle bg
  },
  // Update success/warning/danger to match new semantic colors
  success: {
    DEFAULT: "#059669",
    light: "#ECFDF5",
  },
  warning: {
    DEFAULT: "#D97706",
    light: "#FFFBEB",
  },
  danger: {
    DEFAULT: "#DC2626",
    light: "#FEF2F2",
  },
}
```

### Key Class Name Changes

| Current (Amber) | New (Teal) | Context |
|----------------|------------|---------|
| `bg-amber-500` | `bg-brand-700` or `bg-primary` | Primary buttons, CTAs |
| `bg-amber-400` | `bg-brand-600` | Hover states |
| `text-amber-400` | `text-brand-700` or `text-primary` | Accent text |
| `border-amber-500/40` | `border-primary/40` | Selected card borders |
| `bg-amber-500/[0.06]` | `bg-primary/[0.06]` | Selected card bg |
| `border-l-amber-500` | `border-l-primary` | Left accent border |
| `shadow-amber-500/20` | `shadow-primary/20` | Button shadows |
| `bg-[#0A0A0C]` | `bg-[#FAFAF9]` (light) / `bg-[#0C0D0F]` (dark) | Page background |
| `bg-[#141418]` | `bg-white` (light) / `bg-[#141517]` (dark) | Cards |
| `border-[#252528]` | `border-[#E7E5E4]` (light) / `border-[#27282B]` (dark) | Borders |
| `text-slate-400` | `text-stone-500` or `text-text-secondary` | Secondary text |
| `text-slate-500` | `text-stone-400` | Tertiary/muted |

---

## 📊 Anti-AI Design — Keep & Adapt

QueueNow ควรคงเทคนิค anti-AI จาก KimDev แต่ปรับโทนสี:

| Technique | Keep? | Adaptation |
|-----------|-------|------------|
| Organic blobs (`.blob`) | ✅ Keep | เปลี่ยนจาก amber → teal: `bg-teal-700/[0.04]` |
| Card rotation (`.card-tilt-*`) | ✅ Keep | ลด rotation ลงอีก (0.1-0.2deg) — calm, ไม่ playful เกิน |
| Noise overlay (`.noise-overlay`) | ✅ Keep | ลด opacity → 0.025 (cleaner look) |
| Glass bottom bar (`.glass-bar`) | ✅ Keep | Light mode: `bg-white/85`, dark mode: `bg-[#0C0D0F]/85` |
| Asymmetric hero layout | ✅ Keep | Left-aligned, decorative elements right |
| ASCII art decorations | ❌ Remove | ไม่เหมาะกับ salon/service context — ดู tech เกิน |
| Staggered card list | ✅ Keep | Slight rotation บนการ์ดบริการ |
| Border-left accent | ✅ Keep | เปลี่ยนสีเป็น teal |

---

## 🎯 Summary: QueueNow vs Competition

| Aspect | Generic SaaS | Booksy | QueueNow (new) |
|--------|-------------|--------|-----------------|
| Primary color | Blue/Purple | Gold/Black | **Teal** |
| Background | White or Dark | Dark | **Warm White (light-first)** |
| Vibe | Corporate | Premium/NYC | **Calm Thai Contemporary** |
| Typography | Inter | Custom sans | **Noto Sans Thai** |
| Booking flow | Complex forms | App-native | **4-step simple, mobile-first** |
| Status colors | Standard | Brand-specific | **Teal-harmonized semantic** |
| Uniqueness | ❌ Generic | Distinctive | **Distinctive + culturally relevant** |

---

## 📝 Next Steps

1. **Frontend (วิว):** Implement CSS variables + Tailwind config ตาม spec นี้
2. **Orchestrator (คิม):** แบ่ง batch retrofit (public pages vs admin pages)
3. **QA (เทส):** ตรวจสอบ contrast ratios, touch targets, responsive breakpoints
4. **Review:** ตรวจว่าสี Teal ใหม่ไม่ไปซ้ำกับ `#2DD4BF` (KimDev code color) — teal-400 ใน dark mode อาจใกล้เคียง → ใช้ teal-500 `#14B8A6` แทนใน dark mode

---

*ออกแบบโดย ดีไซน์ (KimDev Studio Designer Agent)*  
*4 กรกฎาคม 2569 · v2.0 — QueueNow Own Identity*
