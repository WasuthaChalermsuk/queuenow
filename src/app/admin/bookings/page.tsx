"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Search } from "lucide-react";

const STATUS: Record<string, string> = { PENDING: "รอยืนยัน", CONFIRMED: "ยืนยันแล้ว", ARRIVED: "มาถึงแล้ว", SERVING: "กำลังบริการ", COMPLETED: "เสร็จสิ้น", CANCELLED: "ยกเลิก", NO_SHOW: "ไม่มา" };

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings?limit=100${search ? `&search=${search}` : ""}`, { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (data.success) setBookings(data.data || []);
      setError("");
    } catch { setError("โหลดข้อมูลไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, [token, search]);

  useEffect(() => { if (token) fetchBookings(); }, [token, fetchBookings]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">จัดการคิว</h1><p className="text-slate-400 text-sm mt-1">ดูและจัดการรายการจองทั้งหมด</p></div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ/เบอร์/เลขคิว..." className="pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64" />
          </div>
        </div>
      </div>
      {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div> : bookings.length === 0 ? <div className="text-center py-20 text-slate-500">ไม่พบรายการจอง</div> : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-800">{["เลขคิว","วันที่","เวลา","ลูกค้า","บริการ","พนักงาน","สถานะ"].map(h => <th key={h} className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>{bookings.map((b: any) => (
              <tr key={b.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="p-3 text-sm font-mono">{b.bookingNumber}</td>
                <td className="p-3 text-sm text-slate-400">{b.bookingDate?.split("T")[0]}</td>
                <td className="p-3 text-sm">{b.timeSlot}</td>
                <td className="p-3 text-sm">{b.customer?.firstName} {b.customer?.lastName}</td>
                <td className="p-3 text-sm">{b.service?.name}</td>
                <td className="p-3 text-sm">{b.staff ? `${b.staff.firstName} ${b.staff.lastName}` : "-"}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">{STATUS[b.status] || b.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
