"use client";

import { useState, useEffect, useCallback } from "react";

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

const TAB_ICONS: Record<string, string> = {
  hours: "schedule",
  booking: "settings",
  holidays: "event_busy",
};

const TABS = [
  { key: "hours", label: "เวลาทำการ", icon: "schedule" },
  { key: "booking", label: "ตั้งค่าการจอง", icon: "settings" },
  { key: "holidays", label: "วันหยุดพิเศษ", icon: "event_busy" },
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
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตั้งค่า</h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            จัดการการตั้งค่าทั้งหมดของร้าน
          </p>
        </div>
      </div>

      {/* Tab Navigation — amber underline style */}
      <div className="flex gap-0 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap relative ${
              activeTab === tab.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

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
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={fetchHours}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          รีเฟรช
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">save</span>
              บันทึก
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
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
              className={`bg-card border rounded-xl p-4 transition-colors ${
                h.isClosed ? "border-border/50 opacity-60" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-muted-foreground">schedule</span>
                  <span className="font-semibold">{dayInfo?.label || h.dayOfWeek}</span>
                </div>
                <button
                  onClick={() => toggleDay(h.dayOfWeek)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    h.isClosed
                      ? "bg-secondary text-muted-foreground hover:text-foreground"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  {h.isClosed ? (
                    <><span className="material-symbols-outlined text-base">toggle_off</span>ปิด</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">toggle_on</span>เปิด</>
                  )}
                </button>
              </div>
              {!h.isClosed && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">เวลาเปิด</label>
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => updateDay(h.dayOfWeek, "openTime", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">เวลาปิด</label>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => updateDay(h.dayOfWeek, "closeTime", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">วัน</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">เวลาเปิด</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">เวลาปิด</th>
              <th className="text-center p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => {
              const dayInfo = DAYS.find((d) => d.key === h.dayOfWeek);
              return (
                <tr
                  key={h.dayOfWeek}
                  className={`border-b border-border/50 ${h.isClosed ? "opacity-50" : "hover:bg-primary/[0.03]"} transition-colors`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-muted-foreground">schedule</span>
                      <span className="font-medium text-sm">{dayInfo?.label || h.dayOfWeek}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <input
                      type="time"
                      value={h.openTime}
                      disabled={h.isClosed}
                      onChange={(e) => updateDay(h.dayOfWeek, "openTime", e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all [color-scheme:dark]"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="time"
                      value={h.closeTime}
                      disabled={h.isClosed}
                      onChange={(e) => updateDay(h.dayOfWeek, "closeTime", e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all [color-scheme:dark]"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleDay(h.dayOfWeek)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        h.isClosed
                          ? "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {h.isClosed ? (
                        <><span className="material-symbols-outlined text-base">toggle_off</span>ปิด</>
                      ) : (
                        <><span className="material-symbols-outlined text-base">toggle_on</span>เปิด</>
                      )}
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
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />กำลังบันทึก...</>
          ) : (
            <><span className="material-symbols-outlined">save</span>บันทึกการตั้งค่า</>
          )}
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
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          รีเฟรช
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">save</span>
              บันทึก
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">settings</span>
          <h3 className="font-semibold">ค่ากำหนดการจอง</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settings.map((setting) => (
            <div key={setting.key}>
              <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                {BOOKING_SETTING_LABELS[setting.key] || setting.key}
              </label>
              <input
                type="number"
                min="0"
                value={setting.value}
                onChange={(e) => updateSetting(setting.key, e.target.value)}
                placeholder={BOOKING_SETTING_PLACEHOLDERS[setting.key] || ""}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/40 transition-all"
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addIsFullDay, setAddIsFullDay] = useState(true);
  const [addStartTime, setAddStartTime] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

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
          <button
            onClick={() => setFilterYear((y) => y - 1)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="font-semibold text-sm min-w-[4rem] text-center font-mono">
            {filterYear}
          </span>
          <button
            onClick={() => setFilterYear((y) => y + 1)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHolidays}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            รีเฟรช
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors relative overflow-hidden group/btn"
          >
            <span className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              เพิ่มวันหยุด
            </span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-card border border-border rounded-xl p-5 mb-4 space-y-4"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">event_busy</span>
            เพิ่มวันหยุดใหม่
          </h3>

          {addError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              {addError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                ชื่อวันหยุด *
              </label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="เช่น วันสงกรานต์, วันหยุดชดเชย"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                วันที่ *
              </label>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 [color-scheme:dark] transition-all"
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
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {addIsFullDay ? "เต็มวัน" : "บางช่วงเวลา"}
            </button>
            <span className="text-xs text-muted-foreground">
              {addIsFullDay ? "หยุดทั้งวัน" : "หยุดเฉพาะช่วงเวลา"}
            </span>
          </div>

          {!addIsFullDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/70">เวลาเริ่ม</label>
                <input
                  type="time"
                  value={addStartTime}
                  onChange={(e) => setAddStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 [color-scheme:dark] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/70">เวลาสิ้นสุด</label>
                <input
                  type="time"
                  value={addEndTime}
                  onChange={(e) => setAddEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 [color-scheme:dark] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/70">
              รายละเอียด (ไม่บังคับ)
            </label>
            <textarea
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-muted-foreground/40 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddError("");
              }}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={adding}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  กำลังเพิ่ม...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">add</span>
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
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
            <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && holidays.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <span className="material-symbols-outlined text-5xl mb-3 opacity-20">calendar_month</span>
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
              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 hover:border-red-500/20 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-red-400">event_busy</span>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{holiday.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTH(holiday.date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
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
                className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 shrink-0"
                title="ลบวันหยุด"
              >
                {deletingId === holiday.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400/30 border-t-red-400" />
                ) : (
                  <span className="material-symbols-outlined">delete</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
