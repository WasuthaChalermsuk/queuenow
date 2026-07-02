"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-5 h-5 text-yellow-400" />,
  CONFIRMED: <CheckCircle className="w-5 h-5 text-green-400" />,
  ARRIVED: <CheckCircle className="w-5 h-5 text-blue-400" />,
  SERVING: <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />,
  COMPLETED: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  CANCELLED: <XCircle className="w-5 h-5 text-red-400" />,
  NO_SHOW: <XCircle className="w-5 h-5 text-orange-400" />,
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

  const statusIcon = booking ? STATUS_ICONS[booking.status] || <Clock className="w-5 h-5 text-slate-400" /> : null;
  const statusText = booking ? STATUS_TEXT[booking.status] || booking.status : "";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-start pt-20 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-5xl text-blue-400 mb-3 block">
            manage_search
          </span>
          <h1 className="text-2xl font-bold mb-2">ติดตามสถานะคิว</h1>
          <p className="text-slate-400 text-sm">
            กรอกเลขคิวหรือหมายเลขอ้างอิงเพื่อดูสถานะ
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="เลขคิว เช่น QN-0001"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !refNumber.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ค้นหา"}
          </button>
        </form>

        {/* Results */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {searched && !error && !booking && (
          <div className="text-center py-10 text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
            ไม่พบข้อมูลสำหรับเลขคิวนี้
          </div>
        )}

        {booking && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Status banner */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">สถานะ</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {statusIcon}
                {statusText}
              </span>
            </div>

            <hr className="border-slate-800" />

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">เลขคิว</span>
                <span className="font-mono font-semibold">{booking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">วันที่</span>
                <span>{booking.bookingDate?.split("T")[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">เวลา</span>
                <span>{booking.timeSlot}</span>
              </div>
              {booking.service && (
                <div className="flex justify-between">
                  <span className="text-slate-400">บริการ</span>
                  <span>{booking.service.name}</span>
                </div>
              )}
              {booking.staff && (
                <div className="flex justify-between">
                  <span className="text-slate-400">พนักงาน</span>
                  <span>
                    {booking.staff.firstName} {booking.staff.lastName}
                  </span>
                </div>
              )}
              {booking.shop && (
                <div className="flex justify-between">
                  <span className="text-slate-400">สาขา</span>
                  <span>{booking.shop.name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
