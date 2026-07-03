"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";

// ============================================
// Select Service Page — Step 1
// Anti-AI: staggered card list, amber border-left accent, glass bottom bar
// ============================================

interface Service {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  duration: number;
  price: number;
  color: string | null;
}

const CATEGORIES = ["ทั้งหมด", "ตัดผม", "ทำสี", "นวด", "สปา", "อื่นๆ"];

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

export default function SelectServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { booking, setService } = useBooking();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("service"));

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const res = await fetch("/api/services");
        const data = await res.json();
        if (data.success) {
          setServices(data.data);
        } else {
          setError(data.error || "ไม่สามารถโหลดข้อมูลบริการได้");
        }
      } catch {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const filtered =
    activeCategory === "ทั้งหมด"
      ? services
      : services.filter((s) => {
          const cat = activeCategory.toLowerCase();
          const name = s.name.toLowerCase();
          if (cat === "ตัดผม") return name.includes("ตัด") || name.includes("ผม") || name.includes("hair");
          if (cat === "ทำสี") return name.includes("สี") || name.includes("color") || name.includes("染");
          if (cat === "นวด") return name.includes("นวด") || name.includes("massage");
          if (cat === "สปา") return name.includes("สปา") || name.includes("spa");
          return true;
        });

  function handleSelect(service: Service) {
    setSelectedId(service.id);
    setService(service.id, service.name, service.price, service.duration);
  }

  function handleNext() {
    if (selectedId) {
      router.push("/book/select-datetime");
    }
  }

  const selectedService = services.find((s) => s.id === selectedId);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Organic blob accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] blob-static pointer-events-none" />

        {/* Header */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-px bg-primary/40" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">ขั้นตอนที่ 1</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">เลือกบริการ</h1>
          <p className="text-sm text-muted-foreground mt-1">เลือกบริการที่คุณต้องการจองคิว</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(15,118,110,0.25)]"
                  : "bg-card text-foreground/80 hover:bg-secondary border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-card border border-border p-5 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                  <div className="w-16 h-5 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-red-400 text-5xl mb-3 block">error_outline</span>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-card hover:bg-secondary text-foreground rounded-lg border border-border"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-muted-foreground/60 text-5xl mb-3 block">content_cut</span>
            <p className="text-muted-foreground">ไม่พบบริการในหมวดนี้</p>
          </div>
        )}

        {/* Service List */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((service, idx) => {
              const isSelected = selectedId === service.id;
              const iconName = getServiceIcon(service.name);
              return (
                <button
                  key={service.id}
                  onClick={() => handleSelect(service)}
                  style={{ transform: `rotate(${idx % 2 === 0 ? "-0.15deg" : "0.1deg"})` }}
                  className={`w-full text-left rounded-xl border p-5 transition-all flex items-center gap-4 ${
                    isSelected
                      ? "border-primary/40 bg-primary/[0.06] border-l-primary border-l-[3px] shadow-[4px_4px_20px_rgba(15,118,110,0.08)]"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${service.color || "#0F766E"}15`,
                                            color: service.color || "#0F766E",
                    }}
                  >
                    <span className="material-symbols-outlined text-2xl">{iconName}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-foreground">{service.name}</h3>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {service.duration} นาที
                      </span>
                    </div>
                  </div>

                  {/* Price + Check */}
                  <div className="text-right shrink-0">
                    <p className="text-primary font-bold text-lg">฿{service.price.toLocaleString()}</p>
                    {isSelected && (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary mt-1">
                        <span className="material-symbols-outlined text-foreground text-base">check</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Bottom Bar — Glass Morphism ===== */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 glass-bar border-t border-border p-4 z-40">
          <div className="container mx-auto max-w-2xl flex items-center justify-between">
            <div className="text-sm">
              {selectedId ? (
                <p>
                  <span className="text-muted-foreground">เลือกแล้ว: </span>
                  <span className="text-primary font-medium">
                    {selectedService?.name}
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground">กรุณาเลือกบริการ</p>
              )}
            </div>
            <button
              disabled={!selectedId}
              onClick={handleNext}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
                selectedId
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_16px_rgba(15,118,110,0.25)]"
                  : "bg-card text-muted-foreground cursor-not-allowed border border-border"
              }`}
            >
              ถัดไป
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
