"use client";

import { useState, useEffect, useCallback } from "react";

interface StaffMember {
  id: string;
  shopId: string;
  code: string | null;
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  color: string;
  isActive: boolean;
  maxConcurrentBookings: number;
  staffServices: {
    service: {
      id: string;
      name: string;
      duration: number;
      color: string;
    };
  }[];
  _count: {
    bookings: number;
    breakTimes: number;
  };
}

const PRESET_COLORS = [
  "#0F766E", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#6366f1",
];

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    color: "#0F766E",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const user =
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem("admin_user") || "null");
          } catch {
            return null;
          }
        })()
      : null;
  const shopId = user?.shopId || "";

  const fetchStaff = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/staff?includeInactive=true", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) {
        setStaff(data.data || []);
      } else {
        setError(data.error || "โหลดข้อมูลไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchStaff();
  }, [token, fetchStaff]);

  function openAddForm() {
    setEditId(null);
    setForm({ firstName: "", lastName: "", nickname: "", color: "#0F766E" });
    setShowForm(true);
  }

  function openEditForm(s: StaffMember) {
    setEditId(s.id);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      nickname: s.nickname || "",
      color: s.color || "#F0A500",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId) {
      setError("ไม่พบข้อมูลร้านค้า กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const method = editId ? "PUT" : "POST";
      const url = editId
        ? `/api/admin/staff/${editId}`
        : "/api/admin/staff";

      const body: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nickname: form.nickname.trim() || null,
        color: form.color,
      };

      if (!editId) {
        body.shopId = shopId;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        setEditId(null);
        fetchStaff();
      } else {
        setError(data.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ต้องการลบ "${name}" ใช่หรือไม่?`)) return;
    setDeletingId(id);
    setError("");

    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) {
        fetchStaff();
      } else {
        setError(data.error || "ลบไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">พนักงาน</h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            จัดการข้อมูลพนักงานของร้าน
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 relative overflow-hidden group/btn"
        >
          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            เพิ่มพนักงาน
          </span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && staff.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl mb-4 block text-muted-foreground/30">group</span>
          <h3 className="text-lg font-medium text-foreground/80 mb-1">ยังไม่มีพนักงาน</h3>
          <p className="text-sm text-muted-foreground mb-6">เพิ่มพนักงานคนแรกเพื่อเริ่มต้นจัดการระบบจองคิว</p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            เพิ่มพนักงาน
          </button>
        </div>
      )}

      {/* Staff Grid — asymmetric staggered */}
      {staff.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s, i) => (
            <div
              key={s.id}
              className={`bg-card border rounded-xl p-5 hover:border-primary/20 transition-all duration-200 group ${
                s.isActive ? "border-border" : "border-border/50 opacity-60"
              }`}
              style={{ transform: `rotate(${(i % 3 - 1) * 0.6}deg)` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: s.color || "#0F766E" }}
                  >
                    {s.nickname?.[0] || s.firstName[0]}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {s.firstName} {s.lastName}
                    </div>
                    {s.nickname && (
                      <div className="text-sm text-muted-foreground">
                        &ldquo;{s.nickname}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
                    s.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-muted-foreground border-slate-500/20"
                  }`}
                >
                  {s.isActive ? "ทำงาน" : "พัก"}
                </span>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span>
                  จองแล้ว{" "}
                  <strong className="text-foreground/80 font-mono">{s._count.bookings}</strong>{" "}
                  ครั้ง
                </span>
              </div>

              {/* Services */}
              {s.staffServices && s.staffServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.staffServices.map((ss) => (
                    <span
                      key={ss.service.id}
                      className="px-2 py-0.5 rounded-md text-xs font-medium border"
                      style={{
                        backgroundColor: ss.service.color + "15",
                        borderColor: ss.service.color + "30",
                        color: ss.service.color,
                      }}
                    >
                      {ss.service.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1 pt-3 border-t border-border">
                <button
                  onClick={() => openEditForm(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  แก้ไข
                </button>
                <button
                  onClick={() =>
                    handleDelete(s.id, `${s.firstName} ${s.lastName}`)
                  }
                  disabled={deletingId === s.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  {deletingId === s.id ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border border-red-400/30 border-t-red-400" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">delete</span>
                  )}
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md animate-in shadow-xl shadow-black/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {editId ? "แก้ไขพนักงาน" : "เพิ่มพนักงานใหม่"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editId
                    ? "อัปเดตข้อมูลพนักงาน"
                    : "กรอกข้อมูลเพื่อเพิ่มพนักงาน"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                  ชื่อ <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  required
                  placeholder="สมชาย"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                  นามสกุล <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  required
                  placeholder="ใจดี"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                  ชื่อเล่น
                </label>
                <input
                  value={form.nickname}
                  onChange={(e) =>
                    setForm({ ...form, nickname: e.target.value })
                  }
                  placeholder="บอย"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                  สีประจำตัว
                </label>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.color === c
                          ? "border-white scale-110 shadow-lg shadow-white/20"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg bg-background border border-border cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    "บันทึก"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
