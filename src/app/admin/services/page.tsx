"use client";
import { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "", color: "#3b82f6" });
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  async function fetchServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services?includeInactive=true", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (data.success) setServices(data.data || []);
    } catch { setError("โหลดไม่สำเร็จ"); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (token) fetchServices(); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/admin/services/${editId}` : "/api/admin/services";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ name: form.name, price: parseFloat(form.price) || 0, duration: parseInt(form.duration) || 30, color: form.color }) });
    if (res.ok) { setShowForm(false); setEditId(null); setForm({ name: "", price: "", duration: "", color: "#3b82f6" }); fetchServices(); }
  }

  function editService(s: any) { setEditId(s.id); setForm({ name: s.name, price: String(s.price || ""), duration: String(s.duration || ""), color: s.color || "#3b82f6" }); setShowForm(true); }

  async function deleteService(id: string) {
    if (!confirm("ลบบริการนี้?")) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
    fetchServices();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">บริการ</h1><p className="text-slate-400 text-sm mt-1">จัดการรายการบริการของร้าน</p></div>
        <button onClick={() => { setEditId(null); setForm({ name: "", price: "", duration: "", color: "#3b82f6" }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500"><Plus className="w-4 h-4" />เพิ่มบริการ</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editId ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm mb-1">ชื่อบริการ</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">ราคา (บาท)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" /></div>
                <div><label className="block text-sm mb-1">ระยะเวลา (นาที)</label><input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" /></div>
              </div>
              <div><label className="block text-sm mb-1">สี</label><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-lg bg-slate-800 border border-slate-700" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-sm">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: s.color }}>{s.name[0]}</div>
                  <div><div className="font-medium">{s.name}</div><div className="text-xs text-slate-500">{s.duration} นาที</div></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => editService(s)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteService(s.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="text-lg font-bold text-blue-400">฿{s.price}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
