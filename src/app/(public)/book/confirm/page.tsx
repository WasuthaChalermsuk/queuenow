"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";
import { useCustomerAuth } from "@/lib/hooks";
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  User,
  Scissors,
  MessageSquare,
  Edit3,
  CreditCard,
  LogIn,
  UserCheck,
} from "lucide-react";

// ============================================
// Confirm Page — Step 4 (Review + Customer Info)
// ============================================

interface Shop {
  id: string;
  name: string;
}

export default function ConfirmPage() {
  const router = useRouter();
  const { booking, setCustomerInfo, setShop, resetBooking } = useBooking();
  const { isLoggedIn, customer, loading: authLoading, login } = useCustomerAuth();

  const [firstName, setFirstName] = useState(booking.customerFirstName);
  const [lastName, setLastName] = useState(booking.customerLastName);
  const [phone, setPhone] = useState(booking.customerPhone);
  const [email, setEmail] = useState(booking.customerEmail);
  const [notes, setNotes] = useState(booking.notes);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopLoaded, setShopLoaded] = useState(false);

  // Auto-fill from LINE profile when logged in
  useEffect(() => {
    if (customer && !booking.customerFirstName) {
      setFirstName(customer.firstName || "");
      setLastName(customer.lastName || "");
      // Phone/Email may also be available if previously filled
      if (customer.phone) setPhone(customer.phone);
      if (customer.email) setEmail(customer.email);
    }
  }, [customer, booking.customerFirstName]);

  // Load shop info
  useEffect(() => {
    if (booking.shopId) {
      setShopLoaded(true);
      return;
    }

    async function fetchShop() {
      try {
        const res = await fetch("/api/shop");
        const data = await res.json();
        if (data.success) {
          setShop(data.data.id, data.data.name);
        }
      } catch {
        // Non-critical
      } finally {
        setShopLoaded(true);
      }
    }
    fetchShop();
  }, []);

  // Redirect if no service
  useEffect(() => {
    if (!booking.serviceId) {
      router.replace("/book/select-service");
    }
  }, [booking.serviceId]);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    if (!firstName.trim() || !phone.trim()) {
      setError("กรุณากรอกชื่อและเบอร์โทรศัพท์");
      return;
    }

    if (!booking.serviceId || !booking.bookingDate || !booking.timeSlot || !booking.shopId) {
      setError("ข้อมูลการจองไม่ครบถ้วน กรุณาเริ่มใหม่");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: booking.shopId,
          serviceId: booking.serviceId,
          staffId: booking.staffId || undefined,
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,
          customer: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
          },
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Store in localStorage for success page
        localStorage.setItem(
          "queuenow_last_booking",
          JSON.stringify({
            bookingNumber: data.data.bookingNumber,
            serviceName: booking.serviceName,
            bookingDate: booking.bookingDate,
            timeSlot: booking.timeSlot,
            staffName: booking.staffName || "ใครก็ได้",
            shopName: booking.shopName,
          })
        );
        router.push("/book/success");
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการจอง");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking.serviceId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">ยืนยันการจอง</h1>
        <p className="text-sm text-slate-400">ตรวจสอบข้อมูลและกรอกรายละเอียด</p>
      </div>

      {/* ===== Booking Summary ===== */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          สรุปรายการจอง
        </h3>

        <div className="space-y-3">
          {/* Service */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-400">บริการ</p>
              <p className="font-medium truncate">{booking.serviceName}</p>
            </div>
            <button
              onClick={() => router.push("/book/select-service")}
              className="text-blue-400 hover:text-blue-300 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-400">วันที่</p>
              <p className="font-medium">
                {booking.bookingDate ? `${getDayName(booking.bookingDate)} ${formatThaiDate(booking.bookingDate)}` : "-"}
              </p>
            </div>
            <button
              onClick={() => router.push("/book/select-datetime")}
              className="text-blue-400 hover:text-blue-300 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-400">เวลา</p>
              <p className="font-medium">{booking.timeSlot} น.</p>
            </div>
          </div>

          {/* Staff */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-400">พนักงาน</p>
              <p className="font-medium">{booking.staffName || "ใครก็ได้"}</p>
            </div>
            <button
              onClick={() => router.push("/book/select-staff")}
              className="text-blue-400 hover:text-blue-300 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Price */}
          {booking.servicePrice !== null && (
            <div className="flex items-center gap-3 pt-3 border-t border-slate-700/50">
              <div className="w-9 h-9 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">ราคา</p>
                <p className="text-xl font-bold text-blue-400">
                  ฿{booking.servicePrice.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== LINE Login Section ===== */}
      <div className="mb-6">
        {authLoading ? (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-sm text-slate-400">กำลังตรวจสอบสถานะ...</span>
          </div>
        ) : isLoggedIn ? (
          <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-400">
                🔐 เข้าสู่ระบบด้วย LINE แล้ว
              </p>
              <p className="text-xs text-slate-400 truncate">
                {customer?.firstName} {customer?.lastName}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => login("/book/confirm")}
            className="w-full rounded-xl bg-[#06C755]/20 border border-[#06C755]/40 hover:bg-[#06C755]/30 p-4 flex items-center gap-3 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">
                🔐 Login ด้วย LINE
              </p>
              <p className="text-xs text-slate-400">
                กรอกข้อมูลอัตโนมัติ ไม่ต้องพิมพ์เอง
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#06C755]" />
          </button>
        )}
      </div>

      {/* ===== Customer Form ===== */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          ข้อมูลผู้จอง
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              ชื่อ <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ชื่อจริง"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">นามสกุล</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="นามสกุล"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              เบอร์โทรศัพท์ <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812345678"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            หมายเหตุ (ไม่บังคับ)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="แจ้งความต้องการพิเศษ..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
      </form>

      {/* ===== Bottom Bar ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 z-40">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div className="text-sm">
            <p className="text-slate-400">
              {booking.serviceName} — {booking.timeSlot} น.
            </p>
          </div>
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
              submitting
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังจอง...
              </>
            ) : (
              <>
                ยืนยันการจอง
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
