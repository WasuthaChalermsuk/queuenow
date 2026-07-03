"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================
// My Bookings Page
// Anti-AI: amber accents, staggered cards, glass elements
// ============================================

// Types
interface BookingItem {
  id: string;
  bookingDate: string;
  timeSlot: string;
  queuePosition: number;
  status: string;
  note?: string;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    color: string;
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    nickname?: string;
    color?: string;
  } | null;
  shop: {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BookingsResponse {
  bookings: BookingItem[];
  pagination: Pagination;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอ",
  CONFIRMED: "ยืนยันแล้ว",
  ARRIVED: "มาถึงแล้ว",
  SERVING: "กำลังให้บริการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  NO_SHOW: "ไม่มา",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-primary/10 text-primary border-primary/20",
  CONFIRMED: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  ARRIVED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  SERVING: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  NO_SHOW: "bg-slate-500/10 text-muted-foreground border-slate-500/20",
};

const CAN_CANCEL_STATUSES = ["PENDING", "CONFIRMED"];

// ============================================
// Main Page
// ============================================
export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [lookupMethod, setLookupMethod] = useState<"phone" | "email">("phone");
  const [lookupValue, setLookupValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<BookingsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // On mount, try to load saved lookup from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("customer_lookup");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.method) setLookupMethod(parsed.method);
        if (parsed.value) {
          setLookupValue(parsed.value);
          performSearch(parsed.method, parsed.value);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = useCallback(
    async (method?: "phone" | "email", value?: string) => {
      const m = method || lookupMethod;
      const v = value || lookupValue;
      if (!v.trim()) return;

      setError("");
      setLoading(true);
      setIsSearching(true);

      localStorage.setItem(
        "customer_lookup",
        JSON.stringify({ method: m, value: v })
      );

      const params = new URLSearchParams();
      params.set(m === "phone" ? "phone" : "email", v.trim());
      params.set("status", activeTab);
      params.set("limit", "50");

      try {
        const res = await fetch(`/api/me/bookings?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "ไม่พบข้อมูล");
          setData(null);
        }
      } catch {
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [lookupMethod, lookupValue, activeTab]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    performSearch();
  }

  // Switch tab and re-search
  function switchTab(tab: "upcoming" | "past") {
    setActiveTab(tab);
    if (isSearching) {
      const params = new URLSearchParams();
      params.set(
        lookupMethod === "phone" ? "phone" : "email",
        lookupValue.trim()
      );
      params.set("status", tab);
      params.set("limit", "50");

      setError("");
      setLoading(true);
      fetch(`/api/me/bookings?${params.toString()}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setData(json.data);
          } else {
            setError(json.error || "ไม่พบข้อมูล");
            setData(null);
          }
        })
        .catch(() => {
          setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
          setData(null);
        })
        .finally(() => setLoading(false));
    }
  }

  // Cancel booking
  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");

    const params = new URLSearchParams();
    if (lookupMethod === "phone") params.set("phone", lookupValue.trim());
    else params.set("email", lookupValue.trim());

    try {
      const res = await fetch(
        `/api/me/bookings/${cancelTarget.id}/cancel?${params.toString()}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: cancelReason || undefined }),
        }
      );
      const json = await res.json();

      if (json.success) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            bookings: prev.bookings.map((b) =>
              b.id === cancelTarget.id
                ? { ...b, status: "CANCELLED" }
                : b
            ),
          };
        });
        setCancelTarget(null);
        setCancelReason("");
      } else {
        setCancelError(json.error || "ยกเลิกไม่สำเร็จ");
      }
    } catch {
      setCancelError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Organic blob accent */}
      <div className="fixed top-0 right-0 w-72 h-72 bg-primary/[0.03] blob-static pointer-events-none" />

      <div className="container mx-auto max-w-2xl px-4 py-6 relative z-10">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
            กลับหน้าหลัก
          </a>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-px bg-primary/40" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">ประวัติ</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">การจองของฉัน</h1>
          <p className="text-muted-foreground text-sm mt-1">
            ตรวจสอบประวัติและสถานะการจองของคุณ
          </p>
        </div>

        {/* Lookup Form (if not yet searched) */}
        {!isSearching && (
          <form
            onSubmit={handleSearch}
            className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6"
            style={{ transform: "rotate(-0.15deg)" }}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/10 mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">search</span>
              </div>
              <h2 className="font-semibold text-lg text-foreground">ค้นหาการจอง</h2>
              <p className="text-sm text-muted-foreground mt-1">
                กรุณากรอกเบอร์โทรศัพท์หรืออีเมลที่ใช้ตอนจอง
              </p>
            </div>

            {/* Method Toggle */}
            <div className="flex gap-2 p-1 bg-background rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setLookupMethod("phone")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  lookupMethod === "phone"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-base">call</span>
                เบอร์โทร
              </button>
              <button
                type="button"
                onClick={() => setLookupMethod("email")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  lookupMethod === "email"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-base">mail</span>
                อีเมล
              </button>
            </div>

            {/* Input */}
            <div>
              <input
                type={lookupMethod === "email" ? "email" : "tel"}
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                placeholder={
                  lookupMethod === "phone"
                    ? "เช่น 0812345678"
                    : "เช่น customer@email.com"
                }
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 placeholder:text-muted-foreground/60"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">search</span>
              ค้นหา
            </button>
          </form>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            <span className="material-symbols-outlined text-base shrink-0">error_outline</span>
            {error}
            {isSearching && (
              <button
                onClick={() => {
                  setIsSearching(false);
                  setError("");
                }}
                className="ml-auto text-xs underline hover:text-red-300"
              >
                ค้นหาใหม่
              </button>
            )}
          </div>
        )}

        {/* Tabs — after search */}
        {isSearching && !error && (
          <>
            {/* Lookup Info + Change */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {lookupMethod === "phone" ? (
                  <span className="material-symbols-outlined text-base">call</span>
                ) : (
                  <span className="material-symbols-outlined text-base">mail</span>
                )}
                <span>{lookupValue}</span>
              </div>
              <button
                onClick={() => setIsSearching(false)}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                เปลี่ยน
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-4">
              <button
                onClick={() => switchTab("upcoming")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "upcoming"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-base">arrow_outward</span>
                กำลังจะมาถึง
              </button>
              <button
                onClick={() => switchTab("past")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "past"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-base">history</span>
                ประวัติ
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <span className="material-symbols-outlined material-icon-spin text-primary text-4xl">progress_activity</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && data && data.bookings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <span className="material-symbols-outlined text-6xl mb-3 opacity-40">calendar_month</span>
                <p className="text-lg font-medium text-muted-foreground">
                  {activeTab === "upcoming"
                    ? "ไม่มีการจองที่กำลังจะมาถึง"
                    : "ไม่มีประวัติการจอง"}
                </p>
                <p className="text-sm mt-1">
                  {activeTab === "upcoming"
                    ? "คุณยังไม่มีการจองที่รอรับบริการ"
                    : "ประวัติการจองจะแสดงที่นี่หลังรับบริการแล้ว"}
                </p>
              </div>
            )}

            {/* Bookings List */}
            {!loading &&
              data?.bookings.map((booking, idx) => (
                <BookingItemCard
                  key={booking.id}
                  booking={booking}
                  canCancel={CAN_CANCEL_STATUSES.includes(booking.status)}
                  onCancel={() => setCancelTarget(booking)}
                  idx={idx}
                />
              ))}

            {/* Pagination Info */}
            {data && data.pagination.total > 0 && (
              <p className="text-center text-xs text-muted-foreground/60 mt-4">
                แสดง {data.bookings.length} จาก {data.pagination.total} รายการ
              </p>
            )}
          </>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-3">
                <span className="material-symbols-outlined text-red-400 text-2xl">cancel</span>
              </div>
              <h2 className="font-bold text-lg text-foreground">ยืนยันการยกเลิก</h2>
              <p className="text-sm text-muted-foreground mt-1">
                คุณต้องการยกเลิกการจอง{" "}
                <span className="font-medium text-foreground">
                  {cancelTarget.service.name}
                </span>{" "}
                วันที่{" "}
                <span className="font-medium text-foreground">
                  {formatDate(cancelTarget.bookingDate)}
                </span>{" "}
                เวลา{" "}
                <span className="font-medium text-foreground">
                  {cancelTarget.timeSlot}
                </span>{" "}
                ใช่หรือไม่?
              </p>
            </div>

            {cancelError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span className="material-symbols-outlined text-base shrink-0">error_outline</span>
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/80">
                เหตุผล (ไม่บังคับ)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ระบุเหตุผลการยกเลิก..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelTarget(null);
                  setCancelReason("");
                  setCancelError("");
                }}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground/80 hover:bg-secondary transition-colors disabled:opacity-50"
              >
                กลับ
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <span className="material-symbols-outlined material-icon-spin text-base">progress_activity</span>
                    กำลังยกเลิก...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">cancel</span>
                    ยืนยันยกเลิก
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Booking Card Component
// ============================================
function BookingItemCard({
  booking,
  canCancel,
  onCancel,
  idx,
}: {
  booking: BookingItem;
  canCancel: boolean;
  onCancel: () => void;
  idx: number;
}) {
  const tilt = idx % 2 === 0 ? "rotate(-0.15deg)" : "rotate(0.1deg)";

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 mb-3 space-y-3"
      style={{ transform: tilt }}
    >
      {/* Header: Status + Queue */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${
            STATUS_COLORS[booking.status] || "bg-slate-800 text-muted-foreground border-slate-700"
          }`}
        >
          {STATUS_LABELS[booking.status] || booking.status}
        </span>
        {booking.queuePosition > 0 && (
          <span className="text-xs text-muted-foreground font-mono">
            คิวที่ {booking.queuePosition}
          </span>
        )}
      </div>

      {/* Service */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor:
              (booking.service.color || "#0F766E") + "15",
          }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: booking.service.color || "#0F766E" }}
          >
            content_cut
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground">{booking.service.name}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">schedule</span>
              {booking.service.duration} นาที
            </span>
            <span>{formatPrice(booking.service.price)}</span>
          </div>
        </div>
      </div>

      {/* Detail Row */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          <span>{formatDate(booking.bookingDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span className="font-mono">{booking.timeSlot}</span>
        </div>
        {booking.staff && (
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <span className="material-symbols-outlined text-sm">person</span>
            <span>
              {booking.staff.nickname ||
                `${booking.staff.firstName} ${booking.staff.lastName}`}
            </span>
          </div>
        )}
        {booking.shop && (
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="text-xs">{booking.shop.name}</span>
          </div>
        )}
      </div>

      {/* Cancel Button */}
      {canCancel && (
        <button
          onClick={onCancel}
          className="w-full py-2 rounded-lg border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">cancel</span>
          ยกเลิกการจอง
        </button>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("th-TH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(price);
}
