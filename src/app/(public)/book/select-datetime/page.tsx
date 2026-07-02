"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";

// ============================================
// Select DateTime Page — Step 2
// ============================================

interface AvailabilitySlot {
  time: string;
  available: boolean;
  remainingSlots: number;
  maxSlots: number;
  staffAvailable: number;
}

interface AvailabilityData {
  date: string;
  dayOfWeek: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
  slots: AvailabilitySlot[];
  message?: string;
  holidayName?: string;
}

const DAY_NAMES: Record<string, string> = {
  SUNDAY: "อา",
  MONDAY: "จ",
  TUESDAY: "อ",
  WEDNESDAY: "พ",
  THURSDAY: "พฤ",
  FRIDAY: "ศ",
  SATURDAY: "ส",
};

const MONTH_NAMES = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function getThaiDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function SelectDateTimePage() {
  const router = useRouter();
  const { booking, setDateTime } = useBooking();

  // Calendar state
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(booking.bookingDate ? new Date(booking.bookingDate + "T00:00:00") : null);

  // Availability state
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(booking.timeSlot);

  // Navigate months
  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentMonth]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate || !booking.serviceId) return;

    async function fetchAvailability() {
      setLoadingAvail(true);
      setAvailError(null);
      setAvailability(null);
      setSelectedSlot(null);

      try {
        const dateStr = getThaiDateStr(selectedDate!);
        const params = new URLSearchParams({ date: dateStr });
        if (booking.serviceId) params.set("serviceId", booking.serviceId);

        const res = await fetch(`/api/availability?${params}`);
        const data = await res.json();

        if (data.success) {
          setAvailability(data.data);
        } else {
          setAvailError(data.error || "ไม่สามารถโหลดข้อมูลเวลาได้");
        }
      } catch {
        setAvailError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      } finally {
        setLoadingAvail(false);
      }
    }

    fetchAvailability();
  }, [selectedDate, booking.serviceId]);

  function handleDateClick(date: Date) {
    setSelectedDate(date);
  }

  function handleSlotClick(slot: AvailabilitySlot) {
    if (!slot.available) return;
    setSelectedSlot(slot.time);
  }

  function handleNext() {
    if (selectedDate && selectedSlot) {
      setDateTime(getThaiDateStr(selectedDate), selectedSlot);
      router.push("/book/select-staff");
    }
  }

  // Group slots by period
  const slotsByPeriod = useMemo(() => {
    if (!availability?.slots) return { morning: [], afternoon: [], evening: [] };
    const morning: AvailabilitySlot[] = [];
    const afternoon: AvailabilitySlot[] = [];
    const evening: AvailabilitySlot[] = [];

    for (const slot of availability.slots) {
      const hour = parseInt(slot.time.split(":")[0]);
      if (hour < 12) morning.push(slot);
      else if (hour < 17) afternoon.push(slot);
      else evening.push(slot);
    }
    return { morning, afternoon, evening };
  }, [availability]);

  function formatThaiDate(date: Date): string {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">เลือกวันและเวลา</h1>
        <p className="text-sm text-slate-400">
          {booking.serviceName ? (
            <>
              บริการ: <span className="text-blue-400">{booking.serviceName}</span>
            </>
          ) : (
            "เลือกวันและเวลาที่สะดวก"
          )}
        </p>
      </div>

      {/* ===== Calendar ===== */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-6">
        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors"
            disabled={currentMonth <= new Date(today.getFullYear(), today.getMonth(), 1)}
          >
            <ChevronLeft className={`w-5 h-5 ${currentMonth <= new Date(today.getFullYear(), today.getMonth(), 1) ? "text-slate-600" : "text-slate-300"}`} />
          </button>
          <h3 className="font-semibold text-lg">
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
          </h3>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
            <div
              key={i}
              className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : "text-slate-500"}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;

            const isPast = date < today;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isSunday = date.getDay() === 0;

            return (
              <button
                key={idx}
                disabled={isPast}
                onClick={() => handleDateClick(date)}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  isPast
                    ? "text-slate-600 cursor-not-allowed"
                    : isSelected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : isToday
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : isSunday
                    ? "text-red-400 hover:bg-slate-700/50"
                    : "text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Time Slots ===== */}
      {selectedDate && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">{formatThaiDate(selectedDate)}</h3>
          </div>

          {/* Loading */}
          {loadingAvail && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-20 mb-3" />
                  <div className="flex gap-2">
                    <div className="w-20 h-9 bg-slate-700 rounded-lg" />
                    <div className="w-20 h-9 bg-slate-700 rounded-lg" />
                    <div className="w-20 h-9 bg-slate-700 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {availError && !loadingAvail && (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-400">{availError}</p>
            </div>
          )}

          {/* Closed */}
          {availability?.isClosed && !loadingAvail && (
            <div className="text-center py-8 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <Moon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">{availability.message || "ร้านปิดทำการในวันนี้"}</p>
              {availability.holidayName && (
                <p className="text-sm text-slate-500 mt-1">{availability.holidayName}</p>
              )}
            </div>
          )}

          {/* Slots */}
          {availability && !availability.isClosed && !loadingAvail && (
            <div className="space-y-5">
              {/* Morning */}
              {slotsByPeriod.morning.length > 0 && (
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">เช้า</span>
                    <span className="text-xs text-slate-500">00:00 - 12:00</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slotsByPeriod.morning.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => handleSlotClick(slot)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedSlot === slot.time
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                            : slot.available
                            ? "bg-slate-700/70 text-slate-200 hover:bg-slate-600 border border-slate-600/50"
                            : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/30 line-through"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon */}
              {slotsByPeriod.afternoon.length > 0 && (
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sunset className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-slate-300">บ่าย</span>
                    <span className="text-xs text-slate-500">12:00 - 17:00</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slotsByPeriod.afternoon.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => handleSlotClick(slot)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedSlot === slot.time
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                            : slot.available
                            ? "bg-slate-700/70 text-slate-200 hover:bg-slate-600 border border-slate-600/50"
                            : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/30 line-through"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Evening */}
              {slotsByPeriod.evening.length > 0 && (
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-300">เย็น</span>
                    <span className="text-xs text-slate-500">17:00+</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slotsByPeriod.evening.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => handleSlotClick(slot)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedSlot === slot.time
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                            : slot.available
                            ? "bg-slate-700/70 text-slate-200 hover:bg-slate-600 border border-slate-600/50"
                            : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/30 line-through"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No slots */}
              {availability.slots.length === 0 && (
                <div className="text-center py-8 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">ไม่มีช่วงเวลาให้บริการในวันนี้</p>
                </div>
              )}

              {availability.slots.length > 0 && slotsByPeriod.morning.length === 0 && slotsByPeriod.afternoon.length === 0 && slotsByPeriod.evening.length === 0 && (
                <div className="text-center py-8 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">คิวเต็มทุกช่วงเวลาในวันนี้</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No date selected prompt */}
      {!selectedDate && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">กรุณาเลือกวันที่ต้องการจอง</p>
        </div>
      )}

      {/* ===== Bottom Bar ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 z-40">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div className="text-sm">
            {selectedDate && selectedSlot ? (
              <p>
                <span className="text-slate-400">เลือก: </span>
                <span className="text-blue-400 font-medium">
                  {formatThaiDate(selectedDate)} เวลา {selectedSlot} น.
                </span>
              </p>
            ) : selectedDate ? (
              <p className="text-slate-400">กรุณาเลือกเวลา</p>
            ) : (
              <p className="text-slate-500">กรุณาเลือกวันและเวลา</p>
            )}
          </div>
          <button
            disabled={!selectedDate || !selectedSlot}
            onClick={handleNext}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
              selectedDate && selectedSlot
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            ถัดไป
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
