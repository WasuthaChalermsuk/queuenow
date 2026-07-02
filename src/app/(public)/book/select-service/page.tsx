"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";
import { Scissors, Clock, ChevronRight, AlertCircle } from "lucide-react";

// ============================================
// Select Service Page — Step 1
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

  return (
    <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">เลือกบริการ</h1>
        <p className="text-sm text-slate-400">เลือกบริการที่คุณต้องการจองคิว</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
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
              className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-700 shrink-0" />
                <div className="flex-1">
                  <div className="h-5 bg-slate-700 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-3/4" />
                </div>
                <div className="w-16 h-5 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12">
          <Scissors className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">ไม่พบบริการในหมวดนี้</p>
        </div>
      )}

      {/* Service List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelect(service)}
              className={`w-full text-left rounded-xl border p-5 transition-all flex items-center gap-4 ${
                selectedId === service.id
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                  : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${service.color || "#3b82f6"}20`,
                  color: service.color || "#3b82f6",
                }}
              >
                <Scissors className="w-6 h-6" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{service.name}</h3>
                {service.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{service.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {service.duration} นาที
                  </span>
                </div>
              </div>

              {/* Price + Check */}
              <div className="text-right shrink-0">
                <p className="text-blue-400 font-bold text-lg">฿{service.price.toLocaleString()}</p>
                {selectedId === service.id && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ===== Bottom Bar ===== */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 z-40">
          <div className="container mx-auto max-w-2xl flex items-center justify-between">
            <div className="text-sm">
              {selectedId ? (
                <p>
                  <span className="text-slate-400">เลือกแล้ว: </span>
                  <span className="text-blue-400 font-medium">
                    {services.find((s) => s.id === selectedId)?.name}
                  </span>
                </p>
              ) : (
                <p className="text-slate-500">กรุณาเลือกบริการ</p>
              )}
            </div>
            <button
              disabled={!selectedId}
              onClick={handleNext}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
                selectedId
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
