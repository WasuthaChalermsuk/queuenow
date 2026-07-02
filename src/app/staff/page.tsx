"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  CalendarDays,
  Clock,
  User,
  Scissors,
  Hash,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

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
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ARRIVED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  SERVING: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  NO_SHOW: "bg-slate-500/10 text-slate-400 border-slate-500/20",
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

  // --- Loading State ---
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ตารางคิวของฉัน</h1>
          <p className="text-slate-400 text-sm mt-1">
            รายการจองคิวที่ได้รับมอบหมาย
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Date Navigator */}
      <div className="flex items-center justify-between mb-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{formatDate(currentDate)}</span>
          </div>
          {isToday(currentDate) && (
            <span className="text-xs text-emerald-400 font-medium">วันนี้</span>
          )}
        </div>
        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <SummaryCard
            label="ทั้งหมด"
            value={data.summary.total}
            color="text-slate-300"
          />
          <SummaryCard
            label="รอ"
            value={data.summary.pending}
            color="text-yellow-400"
          />
          <SummaryCard
            label="ยืนยัน"
            value={data.summary.confirmed}
            color="text-blue-400"
          />
          <SummaryCard
            label="กำลังให้บริการ"
            value={data.summary.serving}
            color="text-cyan-400"
          />
          <SummaryCard
            label="เสร็จสิ้น"
            value={data.summary.completed}
            color="text-green-400"
          />
        </div>
      )}

      {/* Bookings List */}
      {data?.bookings && data.bookings.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
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
      <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase w-16">
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />คิว
                </div>
              </th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  เวลา
                </div>
              </th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  ลูกค้า
                </div>
              </th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">
                <div className="flex items-center gap-1">
                  <Scissors className="w-3 h-3" />
                  บริการ
                </div>
              </th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase w-32">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.bookings?.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                <td className="p-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-sm">
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
                    <div className="text-xs text-slate-500">
                      {booking.customer.phone}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: booking.service.color || "#3b82f6" }}
                    />
                    <span className="text-sm">{booking.service.name}</span>
                    <span className="text-xs text-slate-500">
                      {booking.service.duration} นาที
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      STATUS_COLORS[booking.status] || "bg-slate-800 text-slate-400 border-slate-700"
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
   Summary Card
   ============================================ */
function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

/* ============================================
   Booking Card (Mobile)
   ============================================ */
function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Header: Queue Position + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-sm">
            {booking.queuePosition}
          </span>
          <div>
            <div className="font-mono text-sm font-medium">
              {booking.timeSlot}
            </div>
          </div>
        </div>
        <span
          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${
            STATUS_COLORS[booking.status] || "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {STATUS_LABELS[booking.status] || booking.status}
        </span>
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-2 text-sm">
        <User className="w-4 h-4 text-slate-500" />
        <span>
          {booking.customer.firstName} {booking.customer.lastName}
        </span>
        <span className="text-xs text-slate-500">{booking.customer.phone}</span>
      </div>

      {/* Service Info */}
      <div className="flex items-center gap-2 text-sm">
        <Scissors className="w-4 h-4 text-slate-500" />
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: booking.service.color || "#3b82f6" }}
        />
        <span>{booking.service.name}</span>
        <span className="text-xs text-slate-500">
          {booking.service.duration} นาที
        </span>
      </div>
    </div>
  );
}
