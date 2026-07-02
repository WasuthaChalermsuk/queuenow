"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Clock, CheckCircle2, XCircle, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

interface Booking {
  id: string;
  bookingNumber: string;
  bookingDate: string;
  timeSlot: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  service?: { name: string };
  staff?: { firstName: string; lastName: string };
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอยืนยัน", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  CONFIRMED: { label: "ยืนยันแล้ว", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  ARRIVED: { label: "มาถึงแล้ว", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  SERVING: { label: "กำลังบริการ", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  COMPLETED: { label: "เสร็จสิ้น", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  CANCELLED: { label: "ยกเลิก", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  NO_SHOW: { label: "ไม่มา", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [dashRes, bookRes] = await Promise.all([
        fetch("/api/admin/dashboard", { headers: { Authorization: "Bearer " + token } }),
        fetch(`/api/admin/bookings?limit=50${statusFilter ? `&status=${statusFilter}` : ""}`, { headers: { Authorization: "Bearer " + token } }),
      ]);
      const dash = await dashRes.json();
      const book = await bookRes.json();

      if (dash.success) {
        setStats(dash.data.stats || { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
      }
      if (book.success) {
        setBookings(book.data || []);
      }
      setError("");
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateStatus(bookingId: string, status: string) {
    setActionId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchData();
    } catch {} finally {
      setActionId(null);
    }
  }

  const statCards = [
    { label: "คิววันนี้", value: stats.total, icon: CalendarCheck, color: "text-slate-400" },
    { label: "รอยืนยัน", value: stats.pending, icon: Clock, color: "text-yellow-400" },
    { label: "ยืนยันแล้ว", value: stats.confirmed, icon: CheckCircle2, color: "text-blue-400" },
    { label: "เสร็จสิ้น", value: stats.completed, icon: CheckCircle2, color: "text-green-400" },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
          <p className="text-slate-400 text-sm mt-1">ภาพรวมระบบจองคิว</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <RefreshCw className="w-4 h-4" />รีเฟรช
        </button>
      </div>

      {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[{ label: "ทั้งหมด", value: "" }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v.label, value: k }))].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีรายการจอง</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">เลขคิว</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">เวลา</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">ลูกค้า</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">บริการ</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">พนักงาน</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">สถานะ</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const st = STATUS_MAP[b.status] || { label: b.status, color: "bg-slate-500/10 text-slate-400" };
                  return (
                    <tr key={b.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-sm font-mono">{b.bookingNumber}</td>
                      <td className="p-3 text-sm text-slate-400">{b.timeSlot}</td>
                      <td className="p-3 text-sm">
                        <div className="font-medium">{b.customerName || "-"}</div>
                        <div className="text-xs text-slate-500">{b.customerPhone || ""}</div>
                      </td>
                      <td className="p-3 text-sm">{b.service?.name || "-"}</td>
                      <td className="p-3 text-sm">{b.staff ? `${b.staff.firstName} ${b.staff.lastName}` : "-"}</td>
                      <td className="p-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>{st.label}</span></td>
                      <td className="p-3 text-right">
                        {b.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => updateStatus(b.id, "CONFIRMED")} disabled={actionId === b.id} className="px-2 py-1 rounded bg-green-600/20 text-green-400 text-xs font-medium hover:bg-green-600/30 disabled:opacity-50">
                              {actionId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "ยืนยัน"}
                            </button>
                            <button onClick={() => updateStatus(b.id, "CANCELLED")} disabled={actionId === b.id} className="px-2 py-1 rounded bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 disabled:opacity-50">
                              {actionId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "ปฏิเสธ"}
                            </button>
                          </div>
                        )}
                        {b.status === "CONFIRMED" && (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => updateStatus(b.id, "ARRIVED")} disabled={actionId === b.id} className="px-2 py-1 rounded bg-purple-600/20 text-purple-400 text-xs font-medium hover:bg-purple-600/30">
                              มาถึงแล้ว
                            </button>
                            <button onClick={() => updateStatus(b.id, "COMPLETED")} disabled={actionId === b.id} className="px-2 py-1 rounded bg-green-600/20 text-green-400 text-xs font-medium hover:bg-green-600/30">
                              เสร็จ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
