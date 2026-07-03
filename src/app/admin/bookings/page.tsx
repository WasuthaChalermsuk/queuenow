"use client";
import { useState, useEffect, useCallback } from "react";

const STATUS: Record<string, string> = {
  PENDING: "รอยืนยัน", CONFIRMED: "ยืนยันแล้ว", ARRIVED: "มาถึงแล้ว",
  SERVING: "กำลังบริการ", COMPLETED: "เสร็จสิ้น", CANCELLED: "ยกเลิก", NO_SHOW: "ไม่มา"
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

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings?limit=100${search ? `&search=${search}` : ""}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) setBookings(data.data || []);
      setError("");
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    if (token) fetchBookings();
  }, [token, fetchBookings]);

  return (
    <div className="animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">จัดการคิว</h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">ดูและจัดการรายการจองทั้งหมด</p>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground pointer-events-none">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ/เบอร์/เลขคิว..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/40 transition-all duration-200"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
            <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <span className="material-symbols-outlined text-5xl mb-3 block opacity-20">event_busy</span>
          <p className="font-light">ไม่พบรายการจอง</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["เลขคิว", "วันที่", "เวลา", "ลูกค้า", "บริการ", "พนักงาน", "สถานะ"].map((h) => (
                    <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-primary/[0.03] transition-colors">
                    <td className="p-3 text-sm font-mono">{b.bookingNumber}</td>
                    <td className="p-3 text-sm text-muted-foreground">{b.bookingDate?.split("T")[0]}</td>
                    <td className="p-3 text-sm">{b.timeSlot}</td>
                    <td className="p-3 text-sm">{b.customer?.firstName} {b.customer?.lastName}</td>
                    <td className="p-3 text-sm">{b.service?.name}</td>
                    <td className="p-3 text-sm">{b.staff ? `${b.staff.firstName} ${b.staff.lastName}` : "-"}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[b.status] || "bg-slate-500/10 text-muted-foreground border-slate-500/20"}`}>
                        {STATUS[b.status] || b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
