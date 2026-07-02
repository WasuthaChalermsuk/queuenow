"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Save,
  Clock,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Settings2,
  CalendarOff,
  Plus,
  Trash2,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// ============================================
// Types
// ============================================
interface ShopHour {
  id?: string;
  shopId?: string;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  slotDuration: number;
  maxBookingsPerSlot: number;
}

interface BookingSetting {
  key: string;
  value: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
  shop: { id: string; name: string; code: string };
}

const DAYS: { key: string; label: string }[] = [
  { key: "MONDAY", label: "วันจันทร์" },
  { key: "TUESDAY", label: "วันอังคาร" },
  { key: "WEDNESDAY", label: "วันพุธ" },
  { key: "THURSDAY", label: "วันพฤหัสบดี" },
  { key: "FRIDAY", label: "วันศุกร์" },
  { key: "SATURDAY", label: "วันเสาร์" },
  { key: "SUNDAY", label: "วันอาทิตย์" },
];

const TABS = [
  { key: "hours", label: "เวลาทำการ", icon: Clock },
  { key: "booking", label: "ตั้งค่าการจอง", icon: Settings2 },
  { key: "holidays", label: "วันหยุดพิเศษ", icon: CalendarOff },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BOOKING_SETTING_LABELS: Record<string, string> = {
  maxBookingsPerDay: "จำนวนคิวสูงสุดต่อวัน",
  maxBookingsPerHour: "จำนวนคิวสูงสุดต่อชั่วโมง",
  minHoursAdvance: "จองล่วงหน้าขั้นต่ำ (ชั่วโมง)",
  maxDaysAdvance: "จองล่วงหน้าสูงสุด (วัน)",
};

const BOOKING_SETTING_PLACEHOLDERS: Record<string, string> = {
  maxBookingsPerDay: "เช่น 100",
  maxBookingsPerHour: "เช่น 10",
  minHoursAdvance: "เช่น 1",
  maxDaysAdvance: "เช่น 30",
};

function getDefaultHours(): ShopHour[] {
  return DAYS.map((d) => ({
    dayOfWeek: d.key,
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: d.key === "SATURDAY" || d.key === "SUNDAY",
    slotDuration: 15,
    maxBookingsPerSlot: 3,
  }));
}

const DEFAULT_BOOKING_SETTINGS: BookingSetting[] = [
  { key: "maxBookingsPerDay", value: "100" },
  { key: "maxBookingsPerHour", value: "10" },
  { key: "minHoursAdvance", value: "1" },
  { key: "maxDaysAdvance", value: "30" },
];

// ============================================
// Main Settings Page
// ============================================
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("hours");

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ตั้งค่า</h1>
          <p className="text-slate-400 text-sm mt-1">
            จัดการการตั้งค่าทั้งหมดของร้าน
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "hours" && (
        <HoursTab token={token} shopId={shopId} />
      )}
      {activeTab === "booking" && (
        <BookingSettingsTab token={token} shopId={shopId} />
      )}
      {activeTab === "holidays" && (
        <HolidaysTab token={token} shopId={shopId} />
      )}
    </div>
  );
}

// ============================================
// TAB: เวลาทำการ (Hours)
// ============================================
function HoursTab({ token, shopId }: { token: string | null; shopId: string }) {
  const [hours, setHours] = useState<ShopHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchHours = useCallback(async () => {
    if (!token || !shopId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/settings/hours?shopId=${shopId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) {
        const fetched = data.data || [];
        if (fetched.length === 0) {
          setHours(getDefaultHours());
        } else {
          setHours(fetched);
        }
      } else {
        setError(data.error || "โหลดข้อมูลไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [token, shopId]);

  useEffect(() => {
    if (token) fetchHours();
  }, [token, fetchHours]);

  function updateDay(
    dayOfWeek: string,
    field: keyof ShopHour,
    value: string | boolean | number
  ) {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  }

  function toggleDay(dayOfWeek: string) {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, isClosed: !h.isClosed } : h
      )
    );
  }

  async function handleSave() {
    if (!shopId) {
      setError("ไม่พบข้อมูลร้านค้า กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settings/hours", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          shopId,
          hours: hours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
            slotDuration: h.slotDuration,
            maxBookingsPerSlot: h.maxBookingsPerSlot,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("บันทึกเวลาทำการเรียบร้อย");
        const updated = data.data?.hours || data.data;
        if (Array.isArray(updated) && updated.length > 0) {
          setHours(updated);
        }
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={fetchHours}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> บันทึก
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {hours.map((h) => {
          const dayInfo = DAYS.find((d) => d.key === h.dayOfWeek);
          return (
            <div
              key={h.dayOfWeek}
              className={`bg-slate-900 border rounded-xl p-4 transition-colors ${
                h.isClosed ? "border-slate-800/50 opacity-60" : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold">{dayInfo?.label || h.dayOfWeek}</span>
                </div>
                <button
                  onClick={() => toggleDay(h.dayOfWeek)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    h.isClosed
                      ? "bg-slate-800 text-slate-500 hover:text-slate-400"
                      : "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                  }`}
                >
                  {h.isClosed ? <><ToggleLeft className="w-4 h-4" />ปิด</> : <><ToggleRight className="w-4 h-4" />เปิด</>}
                </button>
              </div>
              {!h.isClosed && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">เวลาเปิด</label>
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => updateDay(h.dayOfWeek, "openTime", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">เวลาปิด</label>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => updateDay(h.dayOfWeek, "closeTime", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase w-32">วัน</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">เวลาเปิด</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">เวลาปิด</th>
              <th className="text-center p-4 text-xs font-medium text-slate-500 uppercase w-32">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => {
              const dayInfo = DAYS.find((d) => d.key === h.dayOfWeek);
              return (
                <tr
                  key={h.dayOfWeek}
                  className={`border-b border-slate-800/50 ${h.isClosed ? "opacity-50" : "hover:bg-slate-800/30"} transition-colors`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-sm">{dayInfo?.label || h.dayOfWeek}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <input
                      type="time"
                      value={h.openTime}
                      disabled={h.isClosed}
                      onChange={(e) => updateDay(h.dayOfWeek, "openTime", e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="time"
                      value={h.closeTime}
                      disabled={h.isClosed}
                      onChange={(e) => updateDay(h.dayOfWeek, "closeTime", e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleDay(h.dayOfWeek)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        h.isClosed
                          ? "bg-slate-800 text-slate-500 hover:text-slate-400 hover:bg-slate-700"
                          : "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                      }`}
                    >
                      {h.isClosed ? <><ToggleLeft className="w-4 h-4" />ปิด</> : <><ToggleRight className="w-4 h-4" />เปิด</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile bottom save */}
      <div className="mt-6 lg:hidden">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังบันทึก...</> : <><Save className="w-4 h-4" />บันทึกการตั้งค่า</>}
        </button>
      </div>
    </div>
  );
}

// ============================================
// TAB: ตั้งค่าการจอง (Booking Settings)
// ============================================
function BookingSettingsTab({ token, shopId }: { token: string | null; shopId: string }) {
  const [settings, setSettings] = useState<BookingSetting[]>(DEFAULT_BOOKING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSettings = useCallback(async () => {
    if (!token || !shopId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/settings/booking?shopId=${shopId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) {
        const fetched = data.data?.settings || [];
        if (fetched.length > 0) {
          setSettings(fetched);
        }
      } else {
        setError(data.error || "โหลดข้อมูลไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [token, shopId]);

  useEffect(() => {
    if (token) fetchSettings();
  }, [token, fetchSettings]);

  function updateSetting(key: string, value: string) {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  }

  async function handleSave() {
    if (!shopId) {
      setError("ไม่พบข้อมูลร้านค้า กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settings/booking", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ shopId, settings }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("บันทึกการตั้งค่าการจองเรียบร้อย");
        const updated = data.data?.settings;
        if (Array.isArray(updated) && updated.length > 0) {
          setSettings(updated);
        }
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> บันทึก
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">ค่ากำหนดการจอง</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settings.map((setting) => (
            <div key={setting.key}>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">
                {BOOKING_SETTING_LABELS[setting.key] || setting.key}
              </label>
              <input
                type="number"
                min="0"
                value={setting.value}
                onChange={(e) => updateSetting(setting.key, e.target.value)}
                placeholder={BOOKING_SETTING_PLACEHOLDERS[setting.key] || ""}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-600"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB: วันหยุดพิเศษ (Holidays)
// ============================================
function HolidaysTab({ token, shopId }: { token: string | null; shopId: string }) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addIsFullDay, setAddIsFullDay] = useState(true);
  const [addStartTime, setAddStartTime] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Year filter
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);

  const fetchHolidays = useCallback(async () => {
    if (!token || !shopId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/settings/holidays?shopId=${shopId}&year=${filterYear}&limit=200`,
        { headers: { Authorization: "Bearer " + token } }
      );
      const data = await res.json();
      if (data.success) {
        setHolidays(data.data?.holidays || []);
      } else {
        setError(data.error || "โหลดข้อมูลไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [token, shopId, filterYear]);

  useEffect(() => {
    if (token) fetchHolidays();
  }, [token, fetchHolidays]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addDate) {
      setAddError("กรุณากรอกชื่อและวันที่");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      const body: Record<string, unknown> = {
        shopId,
        name: addName.trim(),
        date: addDate,
        isFullDay: addIsFullDay,
      };
      if (!addIsFullDay) {
        body.startTime = addStartTime;
        body.endTime = addEndTime;
      }
      if (addDescription.trim()) {
        body.description = addDescription.trim();
      }

      const res = await fetch("/api/admin/settings/holidays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("เพิ่มวันหยุดเรียบร้อย");
        setHolidays((prev) => [data.data.holiday, ...prev].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setShowAddForm(false);
        setAddName("");
        setAddDate("");
        setAddIsFullDay(true);
        setAddStartTime("");
        setAddEndTime("");
        setAddDescription("");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setAddError(data.error || "เพิ่มไม่สำเร็จ");
      }
    } catch {
      setAddError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/settings/holidays/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.data?.message || "ลบวันหยุดเรียบร้อย");
        setHolidays((prev) => prev.filter((h) => h.id !== id));
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "ลบไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDateTH(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {/* Year Filter */}
          <button
            onClick={() => setFilterYear((y) => y - 1)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm min-w-[4rem] text-center">
            {filterYear}
          </span>
          <button
            onClick={() => setFilterYear((y) => y + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHolidays}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มวันหยุด
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4 space-y-4"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-blue-400" />
            เพิ่มวันหยุดใหม่
          </h3>

          {addError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {addError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">
                ชื่อวันหยุด *
              </label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="เช่น วันสงกรานต์, วันหยุดชดเชย"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">
                วันที่ *
              </label>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Full Day Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAddIsFullDay(!addIsFullDay)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                addIsFullDay
                  ? "bg-blue-600/20 text-blue-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {addIsFullDay ? "เต็มวัน" : "บางช่วงเวลา"}
            </button>
            <span className="text-xs text-slate-500">
              {addIsFullDay ? "หยุดทั้งวัน" : "หยุดเฉพาะช่วงเวลา"}
            </span>
          </div>

          {/* Time Range (if not full day) */}
          {!addIsFullDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-300">
                  เวลาเริ่ม
                </label>
                <input
                  type="time"
                  value={addStartTime}
                  onChange={(e) => setAddStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-300">
                  เวลาสิ้นสุด
                </label>
                <input
                  type="time"
                  value={addEndTime}
                  onChange={(e) => setAddEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 [color-scheme:dark]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300">
              รายละเอียด (ไม่บังคับ)
            </label>
            <textarea
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none placeholder:text-slate-600"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddError("");
              }}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={adding}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังเพิ่ม...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  เพิ่มวันหยุด
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && holidays.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-lg font-medium">ไม่มีวันหยุดพิเศษ</p>
          <p className="text-sm mt-1">เพิ่มวันหยุดเพื่อจัดการวันปิดทำการพิเศษ</p>
        </div>
      )}

      {/* Holidays List */}
      {!loading && holidays.length > 0 && (
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <CalendarOff className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {holiday.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {formatDateTH(holiday.date)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {holiday.isFullDay
                      ? "หยุดเต็มวัน"
                      : `${holiday.startTime || "?"} - ${holiday.endTime || "?"}`}
                    {holiday.description && (
                      <span className="ml-2 italic">— {holiday.description}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(holiday.id)}
                disabled={deletingId === holiday.id}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 shrink-0"
                title="ลบวันหยุด"
              >
                {deletingId === holiday.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
