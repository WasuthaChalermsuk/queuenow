"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";
import { useCustomerAuth } from "@/lib/hooks";
import { CheckCircle, Calendar, Clock, User, Scissors, Home, ClipboardList, LogIn, Bell, Loader2 } from "lucide-react";

// ============================================
// Success Page — Booking Confirmed!
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
    // Try to get booking from context first, then localStorage
    const stored = localStorage.getItem("queuenow_last_booking");
    if (stored) {
      try {
        setLastBooking(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    // Trigger animation after mount
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
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <div className="text-center">
        {/* ===== Animated Checkmark ===== */}
        <div className="relative inline-flex items-center justify-center mb-6">
          {/* Outer glow */}
          <div
            className={`absolute w-24 h-24 rounded-full bg-green-500/20 transition-all duration-700 ${
              animate ? "scale-100 opacity-100" : "scale-0 opacity-0"
            }`}
          />
          {/* Check icon */}
          <div
            className={`relative w-20 h-20 rounded-full bg-green-500 flex items-center justify-center transition-all duration-500 ${
              animate ? "scale-100 rotate-0" : "scale-0 rotate-180"
            }`}
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1
          className={`text-2xl font-bold mb-2 transition-all duration-500 delay-200 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          จองคิวสำเร็จ! 🎉
        </h1>
        <p
          className={`text-slate-400 mb-8 transition-all duration-500 delay-300 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          การจองของคุณได้รับการยืนยันแล้ว
        </p>

        {/* ===== Booking Reference ===== */}
        <div
          className={`rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 mb-6 text-left transition-all duration-500 delay-400 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Reference Number */}
          <div className="text-center mb-5 pb-5 border-b border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">หมายเลขอ้างอิง</p>
            <p className="text-2xl font-mono font-bold text-blue-400 tracking-wider">
              {bookingRef}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <Scissors className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">บริการ</p>
                <p className="font-medium truncate">{serviceName}</p>
              </div>
            </div>

            {bookingDate && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">วันที่</p>
                  <p className="font-medium">
                    {getDayName(bookingDate)} {formatThaiDate(bookingDate)}
                  </p>
                </div>
              </div>
            )}

            {timeSlot && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">เวลา</p>
                  <p className="font-medium">{timeSlot} น.</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">พนักงาน</p>
                <p className="font-medium">{staffName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== LINE Notification Status ===== */}
        <div
          className={`rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 mb-6 text-left transition-all duration-500 delay-500 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {authLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
              <span className="text-sm text-slate-400">กำลังตรวจสอบ...</span>
            </div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-400">
                  ✅ คุณจะได้รับการแจ้งเตือนผ่าน LINE
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  เราจะส่งสถานะคิวและการยืนยันให้คุณทาง LINE
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    รับการแจ้งเตือนผ่าน LINE
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เชื่อมต่อ LINE เพื่อรับสถานะคิวแบบเรียลไทม์
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => login("/book/success")}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05B44D] text-white font-semibold transition-all active:scale-95 text-sm"
              >
                <LogIn className="w-4 h-4" />
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
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <Home className="w-5 h-5" />
            กลับหน้าแรก
          </button>

          <Link
            href="/track"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-600 transition-all active:scale-95"
          >
            <ClipboardList className="w-5 h-5" />
            ติดตามสถานะคิว
          </Link>

          <button
            onClick={handleGoHome}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <Calendar className="w-5 h-5" />
            จองคิวเพิ่ม
          </button>
        </div>
      </div>
    </div>
  );
}
