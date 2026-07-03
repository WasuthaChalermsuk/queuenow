"use client";

import { useState, useEffect, useCallback } from "react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  color: string;
}

interface Booking {
  id: string;
  bookingDate: string;
  timeSlot: string;
  queuePosition: number;
  status: string;
  note?: string;
  customer: Customer;
  service: Service;
}

interface Summary {
  total: number;
  pending: number;
  confirmed: number;
  arrived: number;
  serving: number;
  completed: number;
}

interface StaffBookingsData {
  date: string;
  staffId: string;
  summary: Summary;
  bookings: Booking[];
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
  CONFIRMED: "bg-primary/10 text-primary border-primary/20",
  ARRIVED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  SERVING: "bg-teal-500/10 text-[#2DD4BF] border-teal-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  NO_SHOW: "bg-slate-500/10 text-muted-foreground border-slate-500/20",
};

export default function StaffDashboardPage() {
  const [data, setData] = useState<StaffBookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const token =
    typeof window !== "undefined" ? localStorage.getItem("staff_token") : null;

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/bookings?date=${currentDate}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "โหลดข้อมูลไม่สำเร็จ");
        setData(null);
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, currentDate]);

  useEffect(() => {
    if (token) fetchBookings();
  }, [token, fetchBookings]);

  function changeDate(days: number) {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split("T")[0]);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function isToday(dateStr: string) {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">กำลังโหลดตารางคิว...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตารางคิวของฉัน</h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            รายการจองคิวที่ได้รับมอบหมาย
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          title="รีเฟรชข้อมูล"
        >
          <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
            refresh
          </span>
          รีเฟรช
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          {error}
        </div>
      )}

      {/* Date Navigator */}
      <div className="flex items-center justify-between mb-4 bg-card border border-border rounded-xl p-3">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-primary">calendar_month</span>
            <span className="font-semibold">{formatDate(currentDate)}</span>
          </div>
          {isToday(currentDate) && (
            <span className="text-xs text-primary font-medium">วันนี้</span>
          )}
        </div>
        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Summary Cards — staggered */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <SummaryCard label="ทั้งหมด" value={data.summary.total} color="text-foreground/70" icon="inventory_2" />
          <SummaryCard label="รอ" value={data.summary.pending} color="text-primary" icon="schedule" offset />
          <SummaryCard label="ยืนยัน" value={data.summary.confirmed} color="text-primary" icon="check_circle" />
          <SummaryCard label="กำลังบริการ" value={data.summary.serving} color="text-[#2DD4BF]" icon="play_arrow" offset />
          <SummaryCard label="เสร็จสิ้น" value={data.summary.completed} color="text-emerald-400" icon="task_alt" />
        </div>
      )}

      {/* Empty State */}
      {data?.bookings && data.bookings.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <span className="material-symbols-outlined text-5xl mb-3 opacity-20">calendar_month</span>
          <p className="text-lg font-medium">ไม่มีการจองในวันที่เลือก</p>
          <p className="text-sm mt-1">ยังไม่มีคิวจองสำหรับวันนี้</p>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {data?.bookings?.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">tag</span>คิว
                </div>
              </th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span>เวลา
                </div>
              </th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">person</span>ลูกค้า
                </div>
              </th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">content_cut</span>บริการ
                </div>
              </th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.bookings?.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-border/50 hover:bg-primary/[0.03] transition-colors"
              >
                <td className="p-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {booking.queuePosition}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm">{booking.timeSlot}</span>
                </td>
                <td className="p-4">
                  <div>
                    <div className="font-medium text-sm">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.customer.phone}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: booking.service.color || "#0F766E" }}
                    />
                    <span className="text-sm">{booking.service.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {booking.service.duration} นาที
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      STATUS_COLORS[booking.status] || "bg-slate-800 text-muted-foreground border-slate-700"
                    }`}
                  >
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================
   Summary Card (staggered)
   ============================================ */
function SummaryCard({
  label,
  value,
  color,
  icon,
  offset,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  offset?: boolean;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 text-center hover:border-primary/20 transition-all duration-200 ${
        offset ? "sm:translate-y-1" : ""
      }`}
      style={{ transform: offset ? "rotate(0.4deg)" : "rotate(-0.3deg)" }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

/* ============================================
   Booking Card (Mobile)
   ============================================ */
function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {booking.queuePosition}
          </span>
          <div>
            <div className="font-mono text-sm font-medium">{booking.timeSlot}</div>
          </div>
        </div>
        <span
          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${
            STATUS_COLORS[booking.status] || "bg-slate-800 text-muted-foreground border-slate-700"
          }`}
        >
          {STATUS_LABELS[booking.status] || booking.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="material-symbols-outlined text-base text-muted-foreground">person</span>
        <span>
          {booking.customer.firstName} {booking.customer.lastName}
        </span>
        <span className="text-xs text-muted-foreground">{booking.customer.phone}</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="material-symbols-outlined text-base text-muted-foreground">content_cut</span>
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: booking.service.color || "#0F766E" }}
        />
        <span>{booking.service.name}</span>
        <span className="text-xs text-muted-foreground">
          {booking.service.duration} นาที
        </span>
      </div>
    </div>
  );
}
