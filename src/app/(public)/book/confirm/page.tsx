"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";
import { useCustomerAuth } from "@/lib/hooks";

// ============================================
// Confirm Page — Step 4 (Review + Customer Info)
// Anti-AI: amber accents, glass bottom bar, asymmetric layout
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
        <span className="material-symbols-outlined text-primary text-4xl animate-spin block mx-auto">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-px bg-primary/40" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">ขั้นตอนที่ 4</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">ยืนยันการจอง</h1>
          <p className="text-sm text-muted-foreground mt-1">ตรวจสอบข้อมูลและกรอกรายละเอียด</p>
        </div>

        {/* ===== Booking Summary ===== */}
        <div className="rounded-xl bg-card border border-border p-5 mb-6" style={{ transform: "rotate(-0.15deg)" }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
            <span className="material-symbols-outlined text-teal-400">check_circle</span>
            สรุปรายการจอง
          </h3>

          <div className="space-y-3">
            {/* Service */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-base">content_cut</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">บริการ</p>
                <p className="font-medium truncate text-foreground">{booking.serviceName}</p>
              </div>
              <button
                onClick={() => router.push("/book/select-service")}
                className="text-primary hover:text-primary/80 shrink-0"
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-violet-400 text-base">calendar_month</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">วันที่</p>
                <p className="font-medium text-foreground">
                  {booking.bookingDate ? `${getDayName(booking.bookingDate)} ${formatThaiDate(booking.bookingDate)}` : "-"}
                </p>
              </div>
              <button
                onClick={() => router.push("/book/select-datetime")}
                className="text-primary hover:text-primary/80 shrink-0"
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">เวลา</p>
                <p className="font-medium text-foreground">{booking.timeSlot} น.</p>
              </div>
            </div>

            {/* Staff */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-teal-400 text-base">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">พนักงาน</p>
                <p className="font-medium text-foreground">{booking.staffName || "ใครก็ได้"}</p>
              </div>
              <button
                onClick={() => router.push("/book/select-staff")}
                className="text-primary hover:text-primary/80 shrink-0"
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
            </div>

            {/* Price */}
            {booking.servicePrice !== null && (
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-pink-400 text-base">credit_card</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ราคา</p>
                  <p className="text-xl font-bold text-primary">
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
            <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
              <span className="material-symbols-outlined material-icon-spin text-primary">progress_activity</span>
              <span className="text-sm text-muted-foreground">กำลังตรวจสอบสถานะ...</span>
            </div>
          ) : isLoggedIn ? (
            <div className="rounded-xl bg-teal-500/5 border border-teal-500/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-teal-400">person_check</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-teal-400">
                  เข้าสู่ระบบด้วย LINE แล้ว
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {customer?.firstName} {customer?.lastName}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => login("/book/confirm")}
              className="w-full rounded-xl bg-[#06C755]/10 border border-[#06C755]/30 hover:bg-[#06C755]/20 p-4 flex items-center gap-3 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-foreground">login</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">
                  Login ด้วย LINE
                </p>
                <p className="text-xs text-muted-foreground">
                  กรอกข้อมูลอัตโนมัติ ไม่ต้องพิมพ์เอง
                </p>
              </div>
              <span className="material-symbols-outlined text-[#06C755]">chevron_right</span>
            </button>
          )}
        </div>

        {/* ===== Customer Form ===== */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <span className="material-symbols-outlined text-primary">person</span>
            ข้อมูลผู้จอง
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                ชื่อ <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ชื่อจริง"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder:text-muted-foreground transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">นามสกุล</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="นามสกุล"
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder:text-muted-foreground transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                เบอร์โทรศัพท์ <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder:text-muted-foreground transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder:text-muted-foreground transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">chat</span>
              หมายเหตุ (ไม่บังคับ)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="แจ้งความต้องการพิเศษ..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none text-foreground placeholder:text-muted-foreground transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span className="material-symbols-outlined shrink-0">error_outline</span>
              {error}
            </div>
          )}
        </form>
      </div>

      {/* ===== Bottom Bar — Glass Morphism ===== */}
      <div className="fixed bottom-0 left-0 right-0 glass-bar border-t border-border p-4 z-40">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div className="text-sm">
            <p className="text-muted-foreground">
              {booking.serviceName} — {booking.timeSlot} น.
            </p>
          </div>
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
              submitting
                ? "bg-card text-muted-foreground cursor-not-allowed border border-border"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_16px_rgba(15,118,110,0.25)]"
            }`}
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined material-icon-spin text-base">progress_activity</span>
                กำลังจอง...
              </>
            ) : (
              <>
                ยืนยันการจอง
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
