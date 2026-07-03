"use client";

import { useState } from "react";

// ============================================
// Track Queue Page
// Anti-AI: asymmetric layout, amber accents, organic elements
// ============================================

const STATUS_ICONS: Record<string, string> = {
  PENDING: "schedule",
  CONFIRMED: "check_circle",
  ARRIVED: "check_circle",
  SERVING: "progress_activity",
  COMPLETED: "check_circle",
  CANCELLED: "cancel",
  NO_SHOW: "cancel",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-primary",
  CONFIRMED: "text-teal-400",
  ARRIVED: "text-blue-400",
  SERVING: "text-primary",
  COMPLETED: "text-teal-400",
  CANCELLED: "text-red-400",
  NO_SHOW: "text-orange-400",
};

const STATUS_BG: Record<string, string> = {
  PENDING: "bg-primary/10 border-primary/20",
  CONFIRMED: "bg-teal-500/10 border-teal-500/20",
  ARRIVED: "bg-blue-500/10 border-blue-500/20",
  SERVING: "bg-primary/10 border-primary/20",
  COMPLETED: "bg-teal-500/10 border-teal-500/20",
  CANCELLED: "bg-red-500/10 border-red-500/20",
  NO_SHOW: "bg-orange-500/10 border-orange-500/20",
};

const STATUS_TEXT: Record<string, string> = {
  PENDING: "รอยืนยัน",
  CONFIRMED: "ยืนยันแล้ว",
  ARRIVED: "มาถึงแล้ว",
  SERVING: "กำลังบริการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  NO_SHOW: "ไม่มา",
};

interface BookingResult {
  id: string;
  bookingNumber: string;
  bookingDate: string;
  timeSlot: string;
  status: string;
  service?: { name: string };
  staff?: { firstName: string; lastName: string };
  shop?: { name: string };
}

export default function TrackPage() {
  const [refNumber, setRefNumber] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = refNumber.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setBooking(null);
    setSearched(false);

    try {
      const res = await fetch(`/api/public/track?ref=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setBooking(data.data);
      } else {
        setError(data.message || "ไม่พบเลขคิวดังกล่าว");
      }
    } catch {
      setError("ไม่สามารถติดตามคิวได้ในขณะนี้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  const statusIcon = booking ? STATUS_ICONS[booking.status] || "schedule" : null;
  const statusText = booking ? STATUS_TEXT[booking.status] || booking.status : "";
  const statusColor = booking ? STATUS_COLORS[booking.status] || "text-muted-foreground" : "";
  const statusBg = booking ? STATUS_BG[booking.status] || "bg-slate-500/10 border-slate-500/20" : "";
  const isServing = booking?.status === "SERVING";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-20 px-4">
      {/* Organic blob accent */}
      <div className="fixed top-0 right-0 w-80 h-80 bg-primary/[0.03] blob-static pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">ติดตาม</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary">manage_search</span>
            <h1 className="text-2xl font-bold text-foreground">ติดตามสถานะคิว</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            กรอกเลขคิวหรือหมายเลขอ้างอิงเพื่อดูสถานะ
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
              search
            </span>
            <input
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="เลขคิว เช่น QN-0001"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !refNumber.trim()}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-primary-foreground transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <span className="material-symbols-outlined material-icon-spin text-base">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">search</span>
                ค้นหา
              </>
            )}
          </button>
        </form>

        {/* Results */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span className="material-symbols-outlined text-base shrink-0">error_outline</span>
            {error}
          </div>
        )}

        {searched && !error && !booking && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-muted-foreground/60 mb-3 block">search_off</span>
            <p className="text-muted-foreground">ไม่พบข้อมูลสำหรับเลขคิวนี้</p>
          </div>
        )}

        {booking && (
          <div className="rounded-xl bg-card border border-border p-5 space-y-4" style={{ transform: "rotate(-0.1deg)" }}>
            {/* Status banner */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${statusBg}`}>
              <span className="text-sm text-muted-foreground">สถานะ</span>
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${statusColor}`}>
                <span className={`material-symbols-outlined text-lg ${isServing ? "material-icon-spin" : ""}`}>
                  {statusIcon}
                </span>
                {statusText}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">เลขคิว</span>
                <span className="font-mono font-semibold text-foreground">{booking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">วันที่</span>
                <span className="text-foreground/90">{booking.bookingDate?.split("T")[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">เวลา</span>
                <span className="text-foreground/90 font-mono">{booking.timeSlot}</span>
              </div>
              {booking.service && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">บริการ</span>
                  <span className="text-foreground/90">{booking.service.name}</span>
                </div>
              )}
              {booking.staff && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">พนักงาน</span>
                  <span className="text-foreground/90">
                    {booking.staff.firstName} {booking.staff.lastName}
                  </span>
                </div>
              )}
              {booking.shop && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สาขา</span>
                  <span className="text-foreground/90">{booking.shop.name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
