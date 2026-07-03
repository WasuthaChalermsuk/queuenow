"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";
import { useCustomerAuth } from "@/lib/hooks";

// ============================================
// Success Page — Booking Confirmed!
// Anti-AI: asymmetric layout, amber accents, organic blob, staggered cards
// ============================================

interface LastBooking {
  bookingNumber: string;
  serviceName: string;
  bookingDate: string;
  timeSlot: string;
  staffName: string;
  shopName: string;
}

export default function SuccessPage() {
  const router = useRouter();
  const { booking, resetBooking } = useBooking();
  const { isLoggedIn, loading: authLoading, login } = useCustomerAuth();
  const [lastBooking, setLastBooking] = useState<LastBooking | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("queuenow_last_booking");
    if (stored) {
      try {
        setLastBooking(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  function formatThaiDate(dateStr: string): string {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    ];
    const [y, m, d] = dateStr.split("-").map(Number);
    return `${d} ${months[m - 1]} ${y + 543}`;
  }

  function getDayName(dateStr: string): string {
    const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const d = new Date(dateStr + "T00:00:00");
    return dayNames[d.getUTCDay()];
  }

  function handleGoHome() {
    resetBooking();
    localStorage.removeItem("queuenow_last_booking");
    router.push("/");
  }

  const bookingRef = lastBooking?.bookingNumber || "-";
  const serviceName = lastBooking?.serviceName || booking.serviceName || "-";
  const bookingDate = lastBooking?.bookingDate || booking.bookingDate;
  const timeSlot = lastBooking?.timeSlot || booking.timeSlot;
  const staffName = lastBooking?.staffName || booking.staffName || "ใครก็ได้";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      {/* Organic background blob */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] blob pointer-events-none" />

      <div className="container max-w-lg relative z-10">
        {/* ===== Success Icon + Title ===== */}
        <div className="mb-8">
          {/* Animated checkmark */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div
              className={`absolute w-24 h-24 rounded-full bg-teal-500/20 transition-all duration-700 ${
                animate ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}
            />
            <div
              className={`relative w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center transition-all duration-500 ${
                animate ? "scale-100 rotate-0" : "scale-0 rotate-180"
              }`}
            >
              <span className="material-symbols-outlined text-foreground text-4xl">check_circle</span>
            </div>
          </div>

          <h1
            className={`text-2xl font-bold text-foreground transition-all duration-500 delay-200 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            จองคิวสำเร็จ!
          </h1>
          <p
            className={`text-muted-foreground mt-1 transition-all duration-500 delay-300 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            การจองของคุณได้รับการยืนยันแล้ว
          </p>
        </div>

        {/* ===== Booking Reference Card ===== */}
        <div
          className={`rounded-xl bg-card border border-border p-6 mb-4 transition-all duration-500 delay-400 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transform: "rotate(-0.15deg)" }}
        >
          {/* Reference Number */}
          <div className="mb-5 pb-5 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">หมายเลขอ้างอิง</p>
            <p className="text-2xl font-mono font-bold text-primary tracking-wider">
              {bookingRef}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">content_cut</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">บริการ</p>
                <p className="font-medium truncate text-foreground">{serviceName}</p>
              </div>
            </div>

            {bookingDate && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-violet-400 text-xl">calendar_month</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">วันที่</p>
                  <p className="font-medium text-foreground">
                    {getDayName(bookingDate)} {formatThaiDate(bookingDate)}
                  </p>
                </div>
              </div>
            )}

            {timeSlot && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">เวลา</p>
                  <p className="font-medium text-foreground">{timeSlot} น.</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-teal-400 text-xl">person</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">พนักงาน</p>
                <p className="font-medium text-foreground">{staffName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== LINE Notification Status ===== */}
        <div
          className={`rounded-xl bg-card border border-border p-5 mb-6 transition-all duration-500 delay-500 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transform: "rotate(0.1deg)" }}
        >
          {authLoading ? (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined material-icon-spin text-primary shrink-0">progress_activity</span>
              <span className="text-sm text-muted-foreground">กำลังตรวจสอบ...</span>
            </div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-teal-400">notifications_active</span>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-400">
                  คุณจะได้รับการแจ้งเตือนผ่าน LINE
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  เราจะส่งสถานะคิวและการยืนยันให้คุณทาง LINE
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">notifications_active</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">
                    รับการแจ้งเตือนผ่าน LINE
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    เชื่อมต่อ LINE เพื่อรับสถานะคิวแบบเรียลไทม์
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => login("/book/success")}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05B44D] text-foreground font-semibold transition-all active:scale-95 text-sm"
              >
                <span className="material-symbols-outlined text-base">login</span>
                เชื่อมต่อ LINE เพื่อรับการแจ้งเตือน
              </button>
            </div>
          )}
        </div>

        {/* ===== Actions ===== */}
        <div
          className={`space-y-3 transition-all duration-500 delay-500 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleGoHome}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-[0_8px_24px_rgba(15,118,110,0.2)] active:scale-95"
          >
            <span className="material-symbols-outlined">home</span>
            กลับหน้าแรก
          </button>

          <Link
            href="/track"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-card hover:bg-secondary text-foreground font-semibold rounded-xl border border-border transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">assignment</span>
            ติดตามสถานะคิว
          </Link>

          <button
            onClick={handleGoHome}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <span className="material-symbols-outlined">calendar_add_on</span>
            จองคิวเพิ่ม
          </button>
        </div>
      </div>
    </div>
  );
}
