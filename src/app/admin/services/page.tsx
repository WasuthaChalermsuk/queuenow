"use client";
import { useState, useEffect } from "react";

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "", color: "#0F766E" });
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  async function fetchServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services?includeInactive=true", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) setServices(data.data || []);
    } catch {
      setError("โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchServices();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/admin/services/${editId}` : "/api/admin/services";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({
        name: form.name,
        price: parseFloat(form.price) || 0,
        duration: parseInt(form.duration) || 30,
        color: form.color,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", price: "", duration: "", color: "#0F766E" });
      fetchServices();
    }
  }

  function editService(s: any) {
    setEditId(s.id);
    setForm({
      name: s.name,
      price: String(s.price || ""),
      duration: String(s.duration || ""),
      color: s.color || "#0F766E",
    });
    setShowForm(true);
  }

  async function deleteService(id: string) {
    if (!confirm("ลบบริการนี้?")) return;
    await fetch(`/api/admin/services/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    fetchServices();
  }

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">บริการ</h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">จัดการรายการบริการของร้าน</p>
        </div>
        <button
          onClick={() => {
            setEditId(null);
            setForm({ name: "", price: "", duration: "", color: "#0F766E" });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 relative overflow-hidden group/btn"
        >
          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            เพิ่มบริการ
          </span>
        </button>
      </div>

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
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                {editId ? "edit" : "add_circle"}
              </span>
              {editId ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-foreground/70">ชื่อบริการ</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 text-foreground/70">ราคา (บาท)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-foreground/70">ระยะเวลา (นาที)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground/70">สี</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full h-10 rounded-lg bg-background border border-border cursor-pointer"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <div
              key={s.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all duration-200 group"
              style={{ transform: `rotate(${(i % 3 - 1) * 0.5}deg)` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: s.color || "#0F766E" }}
                  >
                    {s.name[0]}
                  </div>
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.duration} นาที</div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => editService(s)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => deleteService(s.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
              <div className="text-lg font-bold font-mono text-primary">฿{s.price}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
