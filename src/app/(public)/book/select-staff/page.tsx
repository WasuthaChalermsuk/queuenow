"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";
import { User, ChevronRight, Check, AlertCircle, Users, Scissors } from "lucide-react";

// ============================================
// Select Staff Page — Step 3
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

const STAFF_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#f97316"];

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

  return (
    <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">เลือกพนักงาน</h1>
        <p className="text-sm text-slate-400">
          เลือกพนักงานที่ต้องการ หรือเลือก &quot;ใครก็ได้&quot;
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-700 shrink-0" />
                <div className="flex-1">
                  <div className="h-5 bg-slate-700 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Staff List */}
      {!loading && !error && (
        <div className="space-y-3">
          {/* Anyone */}
          <button
            onClick={() => handleSelect("__any__")}
            className={`w-full text-left rounded-xl border p-5 transition-all flex items-center gap-4 ${
              selectedStaffId === "__any__"
                ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">ใครก็ได้</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ระบบจะจัดพนักงานที่ว่างให้อัตโนมัติ
              </p>
            </div>
            {selectedStaffId === "__any__" && (
              <Check className="w-5 h-5 text-blue-400 shrink-0" />
            )}
          </button>

          {/* Staff cards */}
          {staffList.map((staff, idx) => (
            <button
              key={staff.id}
              onClick={() => handleSelect(staff.id)}
              className={`w-full text-left rounded-xl border p-5 transition-all flex items-center gap-4 ${
                selectedStaffId === staff.id
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                  : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold"
                style={{ backgroundColor: staff.color || getColor(idx) }}
              >
                {getInitials(staff)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{displayName(staff)}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {staff.staffServices.slice(0, 3).map((ss) => (
                    <span
                      key={ss.service.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/50 text-xs text-slate-400"
                    >
                      <Scissors className="w-3 h-3" />
                      {ss.service.name}
                    </span>
                  ))}
                  {staff.staffServices.length > 3 && (
                    <span className="text-xs text-slate-500">
                      +{staff.staffServices.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {selectedStaffId === staff.id && (
                <Check className="w-5 h-5 text-blue-400 shrink-0" />
              )}
            </button>
          ))}

          {/* Empty */}
          {staffList.length === 0 && (
            <div className="text-center py-12">
              <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">ไม่มีพนักงานที่ให้บริการนี้</p>
              <p className="text-sm text-slate-500 mt-1">กรุณาลองเลือก &quot;ใครก็ได้&quot; หรือเปลี่ยนบริการ</p>
            </div>
          )}
        </div>
      )}

      {/* ===== Bottom Bar ===== */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 z-40">
          <div className="container mx-auto max-w-2xl flex items-center justify-between">
            <div className="text-sm">
              {selectedStaffId === "__any__" ? (
                <p className="text-blue-400 font-medium">ใครก็ได้</p>
              ) : selectedStaffId ? (
                <p>
                  <span className="text-slate-400">เลือก: </span>
                  <span className="text-blue-400 font-medium">
                    {staffList.find((s) => s.id === selectedStaffId)?.firstName}
                  </span>
                </p>
              ) : (
                <p className="text-slate-500">กรุณาเลือกพนักงาน</p>
              )}
            </div>
            <button
              disabled={!selectedStaffId}
              onClick={handleNext}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
                selectedStaffId
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
