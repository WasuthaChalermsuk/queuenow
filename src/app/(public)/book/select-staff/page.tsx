"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";

// ============================================
// Select Staff Page — Step 3
// Anti-AI: staggered cards, amber border-left accent, glass bottom bar
// ============================================

interface StaffService {
  service: {
    id: string;
    name: string;
    duration: number;
  };
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatar: string | null;
  color: string | null;
  maxConcurrentBookings: number;
  staffServices: StaffService[];
}

const STAFF_COLORS = ["#0F766E", "#8b5cf6", "#10b981", "#2DD4BF", "#ef4444", "#ec4899", "#06b6d4", "#f97316"];

export default function SelectStaffPage() {
  const router = useRouter();
  const { booking, setStaff } = useBooking();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(booking.staffId || "__any__");

  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (booking.serviceId) params.set("serviceId", booking.serviceId);

        const res = await fetch(`/api/staff?${params}`);
        const data = await res.json();

        if (data.success) {
          setStaffList(data.data);
        } else {
          setError(data.error || "ไม่สามารถโหลดข้อมูลพนักงานได้");
        }
      } catch {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      } finally {
        setLoading(false);
      }
    }
    fetchStaff();
  }, [booking.serviceId]);

  function handleSelect(staffId: string) {
    setSelectedStaffId(staffId);
  }

  function handleNext() {
    if (selectedStaffId) {
      if (selectedStaffId === "__any__") {
        setStaff(null, null);
      } else {
        const staff = staffList.find((s) => s.id === selectedStaffId);
        setStaff(selectedStaffId, staff ? `${staff.firstName} ${staff.lastName}` : null);
      }
      router.push("/book/confirm");
    }
  }

  function getColor(idx: number): string {
    return STAFF_COLORS[idx % STAFF_COLORS.length];
  }

  function getInitials(staff: Staff): string {
    return (staff.firstName.charAt(0) + staff.lastName.charAt(0)).toUpperCase();
  }

  const displayName = (staff: Staff): string => {
    if (staff.nickname) return `${staff.firstName} (${staff.nickname})`;
    return `${staff.firstName} ${staff.lastName}`;
  };

  const selectedStaff = selectedStaffId !== "__any__" ? staffList.find((s) => s.id === selectedStaffId) : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-px bg-primary/40" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">ขั้นตอนที่ 3</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">เลือกพนักงาน</h1>
          <p className="text-sm text-muted-foreground mt-1">
            เลือกพนักงานที่ต้องการ หรือเลือก &quot;ใครก็ได้&quot;
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-card border border-border p-5 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-red-400 text-5xl mb-3 block">error_outline</span>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-card hover:bg-secondary text-foreground rounded-lg border border-border"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* Staff List */}
        {!loading && !error && (
          <div className="space-y-3">
            {/* Anyone — always first, with special styling */}
            <button
              onClick={() => handleSelect("__any__")}
              style={{ transform: "rotate(-0.2deg)" }}
              className={`w-full text-left rounded-xl border p-5 transition-all flex items-center gap-4 ${
                selectedStaffId === "__any__"
                  ? "border-primary/40 bg-primary/[0.06] border-l-primary border-l-[3px] shadow-[4px_4px_20px_rgba(15,118,110,0.08)]"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-xl">group</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">ใครก็ได้</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ระบบจะจัดพนักงานที่ว่างให้อัตโนมัติ
                </p>
              </div>
              {selectedStaffId === "__any__" && (
                <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
              )}
            </button>

            {/* Staff cards */}
            {staffList.map((staff, idx) => (
              <button
                key={staff.id}
                onClick={() => handleSelect(staff.id)}
                style={{ transform: `rotate(${idx % 2 === 0 ? "0.15deg" : "-0.1deg"})` }}
                className={`w-full text-left rounded-xl border p-5 transition-all flex items-center gap-4 ${
                  selectedStaffId === staff.id
                    ? "border-primary/40 bg-primary/[0.06] border-l-primary border-l-[3px] shadow-[4px_4px_20px_rgba(15,118,110,0.08)]"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-foreground font-bold"
                  style={{ backgroundColor: staff.color || getColor(idx) }}
                >
                  {getInitials(staff)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{displayName(staff)}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {staff.staffServices.slice(0, 3).map((ss) => (
                      <span
                        key={ss.service.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
                      >
                        <span className="material-symbols-outlined text-xs">content_cut</span>
                        {ss.service.name}
                      </span>
                    ))}
                    {staff.staffServices.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{staff.staffServices.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {selectedStaffId === staff.id && (
                  <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                )}
              </button>
            ))}

            {/* Empty */}
            {staffList.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-muted-foreground/60 text-5xl mb-3 block">person_off</span>
                <p className="text-muted-foreground">ไม่มีพนักงานที่ให้บริการนี้</p>
                <p className="text-sm text-muted-foreground mt-1">กรุณาลองเลือก &quot;ใครก็ได้&quot; หรือเปลี่ยนบริการ</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Bottom Bar — Glass Morphism ===== */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 glass-bar border-t border-border p-4 z-40">
          <div className="container mx-auto max-w-2xl flex items-center justify-between">
            <div className="text-sm">
              {selectedStaffId === "__any__" ? (
                <p className="text-primary font-medium">ใครก็ได้</p>
              ) : selectedStaffId ? (
                <p>
                  <span className="text-muted-foreground">เลือก: </span>
                  <span className="text-primary font-medium">
                    {selectedStaff?.firstName}
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground">กรุณาเลือกพนักงาน</p>
              )}
            </div>
            <button
              disabled={!selectedStaffId}
              onClick={handleNext}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
                selectedStaffId
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_16px_rgba(15,118,110,0.25)]"
                  : "bg-card text-muted-foreground cursor-not-allowed border border-border"
              }`}
            >
              ถัดไป
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
