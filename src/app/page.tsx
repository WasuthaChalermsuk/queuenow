"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scissors, Sparkles, Clock, Star, ArrowRight, AlertCircle, Store } from "lucide-react";

// ============================================
// Landing Page — QueueNow Public Booking
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
    <div className="min-h-screen">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 mb-6">
              <Store className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {shopName}
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">{shopDescription}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book/select-service"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 active:scale-95"
              >
                จองคิวเลย
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-600 transition-all active:scale-95"
              >
                ติดตามคิว
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto">
              {[
                { icon: Clock, label: "รวดเร็ว", color: "text-blue-400" },
                { icon: Sparkles, label: "สะดวก", color: "text-violet-400" },
                { icon: Star, label: "คุณภาพ", color: "text-amber-400" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Services Section ===== */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">บริการของเรา</h2>
          <p className="text-slate-400">เลือกบริการที่คุณต้องการ แล้วจองคิวได้ทันที</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-slate-700 mb-4" />
                <div className="h-5 bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-700 rounded w-full mb-3" />
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-700 rounded w-16" />
                  <div className="h-4 bg-slate-700 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              ลองใหม่
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="text-center py-12">
            <Scissors className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg">ยังไม่มีบริการในขณะนี้</p>
            <p className="text-slate-500 text-sm mt-1">กรุณากลับมาใหม่ภายหลัง</p>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/book/select-service?service=${service.id}`}
                  className="group relative rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 p-6 transition-all hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${service.color || "#3b82f6"}20`, color: service.color || "#3b82f6" }}
                  >
                    <Scissors className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-400 transition-colors">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <span className="text-blue-400 font-semibold text-lg">฿{service.price.toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />{service.duration} นาที
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-violet-500/0 group-hover:from-blue-500/5 group-hover:to-violet-500/5 transition-all pointer-events-none" />
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/book/select-service"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl border border-slate-600 transition-all"
              >
                ดูบริการทั้งหมด <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} {shopName} — Powered by <span className="text-blue-400">QueueNow</span></p>
        </div>
      </footer>
    </div>
  );
}
