"use client";

import { useState, useEffect, useCallback } from "react";

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
  PENDING: { label: "รอยืนยัน", color: "bg-primary/10 text-primary border-primary/20" },
  CONFIRMED: { label: "ยืนยันแล้ว", color: "bg-primary/10 text-primary border-primary/20" },
  ARRIVED: { label: "มาถึงแล้ว", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  SERVING: { label: "กำลังบริการ", color: "bg-teal-500/10 text-[#2DD4BF] border-teal-500/20" },
  COMPLETED: { label: "เสร็จสิ้น", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  CANCELLED: { label: "ยกเลิก", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  NO_SHOW: { label: "ไม่มา", color: "bg-slate-500/10 text-muted-foreground border-slate-500/20" },
};

const STAT_ICONS: Record<string, string> = {
  total: "event_available",
  pending: "schedule",
  confirmed: "check_circle",
  completed: "task_alt",
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
        setBookings(book.data?.bookings || book.data || []);
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
    { key: "total", label: "คิววันนี้", value: stats.total },
    { key: "pending", label: "รอยืนยัน", value: stats.pending },
    { key: "confirmed", label: "ยืนยันแล้ว", value: stats.confirmed },
    { key: "completed", label: "เสร็จสิ้น", value: stats.completed },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">กำลังโหลดแดชบอร์ด...</span>
        </div>
      </div>
    );

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">ภาพรวมระบบจองคิว</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          รีเฟรช
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* Staggered Stats — asymmetric layout */}
      <div className="mb-8 space-y-3">
        {/* Row 1: 3 cards with staggered widths */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statCards.slice(0, 3).map((s, i) => (
            <div
              key={s.key}
              className={`bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all duration-300 group ${
                i === 1 ? "sm:-translate-y-1 sm:shadow-lg sm:shadow-primary/5" : ""
              }`}
              style={{ transform: `rotate(${(i - 1) * 0.8}deg)` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`material-symbols-outlined text-xl ${
                  s.key === "total" ? "text-muted-foreground" :
                  s.key === "pending" ? "text-primary" :
                  s.key === "confirmed" ? "text-primary" :
                  "text-emerald-400"
                }`}>
                  {STAT_ICONS[s.key]}
                </span>
              </div>
              <div className={`text-3xl font-bold font-mono tracking-tight ${
                s.key === "total" ? "text-foreground/80" :
                s.key === "pending" ? "text-primary" :
                s.key === "confirmed" ? "text-primary" :
                "text-emerald-400"
              }`}>
                {s.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-light">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Row 2: 1 wide card for completed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1" />
          <div
            className="bg-card border border-border rounded-xl p-4 hover:border-emerald-500/20 transition-all duration-300 sm:col-span-2"
            style={{ transform: "rotate(-0.3deg)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-emerald-400">task_alt</span>
                <div>
                  <p className="text-xs text-muted-foreground font-light">เสร็จสิ้น</p>
                  <div className="text-3xl font-bold font-mono tracking-tight text-emerald-400">{stats.completed}</div>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-muted-foreground">อัตราความสำเร็จ</p>
                <p className="text-sm font-mono text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs — amber underline style */}
      <div className="flex gap-1 mb-4 flex-wrap border-b border-border pb-0">
        {[{ label: "ทั้งหมด", value: "" }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v.label, value: k }))].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-2 text-sm font-medium transition-all duration-200 relative ${
              statusFilter === f.value
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            {statusFilter === f.value && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <span className="material-symbols-outlined text-5xl mb-3 block opacity-20">event_available</span>
            <p className="font-light">ยังไม่มีรายการจอง</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">เลขคิว</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">เวลา</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ลูกค้า</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">บริการ</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">พนักงาน</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">สถานะ</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const st = STATUS_MAP[b.status] || { label: b.status, color: "bg-slate-500/10 text-muted-foreground" };
                  return (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-primary/[0.03] transition-colors">
                      <td className="p-3 text-sm font-mono">{b.bookingNumber}</td>
                      <td className="p-3 text-sm text-muted-foreground">{b.timeSlot}</td>
                      <td className="p-3 text-sm">
                        <div className="font-medium">{b.customerName || "-"}</div>
                        <div className="text-xs text-muted-foreground">{b.customerPhone || ""}</div>
                      </td>
                      <td className="p-3 text-sm">{b.service?.name || "-"}</td>
                      <td className="p-3 text-sm">{b.staff ? `${b.staff.firstName} ${b.staff.lastName}` : "-"}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {b.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => updateStatus(b.id, "CONFIRMED")}
                              disabled={actionId === b.id}
                              className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 disabled:opacity-50 transition-colors"
                            >
                              {actionId === b.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border border-emerald-400/30 border-t-emerald-400" />
                              ) : (
                                "ยืนยัน"
                              )}
                            </button>
                            <button
                              onClick={() => updateStatus(b.id, "CANCELLED")}
                              disabled={actionId === b.id}
                              className="px-2 py-1 rounded bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                            >
                              ปฏิเสธ
                            </button>
                          </div>
                        )}
                        {b.status === "CONFIRMED" && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => updateStatus(b.id, "ARRIVED")}
                              disabled={actionId === b.id}
                              className="px-2 py-1 rounded bg-purple-600/20 text-purple-400 text-xs font-medium hover:bg-purple-600/30 transition-colors"
                            >
                              มาถึงแล้ว
                            </button>
                            <button
                              onClick={() => updateStatus(b.id, "COMPLETED")}
                              disabled={actionId === b.id}
                              className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
                            >
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
