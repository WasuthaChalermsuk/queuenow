"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ============================================
// Landing Page — QueueNow Public Booking
// Anti-AI: asymmetric hero, organic blobs, staggered cards, noise texture
// ============================================

interface Service {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  duration: number;
  price: number;
  color: string | null;
  sortOrder: number;
}

interface Shop {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  description: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
}

// Map service keywords to Material Symbols
function getServiceIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("ตัด") || lower.includes("hair") || lower.includes("cut")) return "content_cut";
  if (lower.includes("สระ") || lower.includes("wash") || lower.includes("shampoo")) return "shower";
  if (lower.includes("สี") || lower.includes("color") || lower.includes("染")) return "palette";
  if (lower.includes("นวด") || lower.includes("massage")) return "spa";
  if (lower.includes("สปา") || lower.includes("spa")) return "self_care";
  if (lower.includes("ทรีทเมนท์") || lower.includes("treatment")) return "health_and_beauty";
  if (lower.includes("ยืด") || lower.includes("straight")) return "straighten";
  if (lower.includes("ดัด") || lower.includes("perm") || lower.includes("curl")) return "waves";
  if (lower.includes("โกน") || lower.includes("shave")) return "face_6";
  if (lower.includes("เซ็ท") || lower.includes("set") || lower.includes("style")) return "style";
  return "content_cut";
}

const TILT_CLASSES = ["card-tilt-1", "card-tilt-2", "card-tilt-3"];

export default function LandingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [shopRes, servicesRes] = await Promise.all([
          fetch("/api/shop"),
          fetch("/api/services"),
        ]);
        const shopData = await shopRes.json();
        const servicesData = await servicesRes.json();
        if (shopData.success) setShop(shopData.data);
        if (servicesData.success) setServices(servicesData.data);
        else setError("ไม่สามารถโหลดข้อมูลบริการได้");
      } catch {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const shopName = shop?.name || "QueueNow";
  const shopDescription = shop?.description || "ระบบจองคิวออนไลน์ — สะดวก รวดเร็ว ไม่ต้องรอนาน";

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Hero Section — ASYMMETRIC, LEFT-ALIGNED ===== */}
      <section className="relative overflow-hidden bg-background border-b border-border">
        {/* Organic blob decorations — bleeding off edges */}
        <div className="absolute -top-32 -right-20 w-[500px] h-[500px] bg-primary/[0.04] blob pointer-events-none" />
        <div className="absolute top-40 -left-24 w-[350px] h-[350px] bg-teal-400/[0.04] blob-slow pointer-events-none" />
        <div className="absolute bottom-10 right-[15%] w-[200px] h-[200px] bg-primary/90/[0.06] blob-static pointer-events-none" />

        {/* Decorative line element bleeding off right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-px bg-gradient-to-l from-primary/40 to-transparent pointer-events-none" />
        <div className="absolute right-16 top-[35%] w-px h-24 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-xl md:ml-0">
            {/* Shop icon — Material Symbol */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/[0.08] border border-primary/10 mb-6 card-tilt-1">
              <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight text-foreground">
              {shopName.split(" ").map((word, i) => (
                <span key={i}>
                  {i > 0 && " "}
                  {i === 0 ? (
                    <span className="text-primary">{word}</span>
                  ) : (
                    word
                  )}
                </span>
              ))}
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
              {shopDescription}
            </p>

            {/* CTA buttons — asymmetric sizing */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book/select-service"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl transition-all shadow-[0_8px_32px_rgba(15,118,110,0.2)] hover:shadow-[0_12px_40px_rgba(15,118,110,0.3)] active:scale-[0.97]"
              >
                <span className="material-symbols-outlined text-xl">calendar_add_on</span>
                จองคิวเลย
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-6 py-4 bg-card hover:bg-secondary text-foreground font-semibold rounded-2xl border border-border transition-all active:scale-[0.97]"
              >
                <span className="material-symbols-outlined">manage_search</span>
                ติดตามคิว
              </Link>
            </div>

            {/* Feature pills — asymmetric horizontal distribution */}
            <div className="flex flex-wrap gap-3 mt-10">
              {[
                { icon: "bolt", label: "รวดเร็ว" },
                { icon: "touch_app", label: "สะดวก" },
                { icon: "verified", label: "คุณภาพ" },
              ].map(({ icon, label }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border"
                  style={{ transform: `rotate(${i % 2 === 0 ? "-0.3deg" : "0.2deg"})` }}
                >
                  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                  <span className="text-sm text-foreground/80">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Services Section ===== */}
      <section className="container mx-auto px-4 py-20">
        {/* Section header — asymmetric */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">บริการ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">บริการของเรา</h2>
          <p className="text-muted-foreground mt-2 max-w-md">เลือกบริการที่คุณต้องการ แล้วจองคิวได้ทันที</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-6 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-muted mb-4" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-3" />
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-red-400 text-5xl mb-4 block">error_outline</span>
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-card hover:bg-secondary text-foreground rounded-xl border border-border transition-colors">
              ลองใหม่
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-muted-foreground/60 text-5xl mb-4 block">content_cut</span>
            <p className="text-muted-foreground text-lg">ยังไม่มีบริการในขณะนี้</p>
            <p className="text-muted-foreground text-sm mt-1">กรุณากลับมาใหม่ภายหลัง</p>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
              {services.map((service, idx) => {
                const iconName = getServiceIcon(service.name);
                const tiltClass = TILT_CLASSES[idx % TILT_CLASSES.length];
                return (
                  <Link
                    key={service.id}
                    href={`/book/select-service?service=${service.id}`}
                    className={`group relative rounded-2xl bg-card border border-border hover:border-primary/40 p-6 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(15,118,110,0.08)] ${tiltClass}`}
                  >
                    {/* Accent dot */}
                    <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary/30 group-hover:bg-primary/60 transition-colors" />

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${service.color || "#0F766E"}15`, color: service.color || "#0F766E" }}
                    >
                      <span className="material-symbols-outlined text-2xl">{iconName}</span>
                    </div>

                    <h3 className="text-lg font-semibold mb-1 text-foreground group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-primary font-bold text-lg">
                        ฿{service.price.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        {service.duration} นาที
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex justify-start mt-10">
              <Link
                href="/book/select-service"
                className="inline-flex items-center gap-2 px-6 py-3 bg-card hover:bg-secondary text-foreground rounded-xl border border-border transition-all card-tilt-2"
              >
                ดูบริการทั้งหมด
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {shopName}</p>
          <p>
            Powered by <span className="text-primary font-medium">QueueNow</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
