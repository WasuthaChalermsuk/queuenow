"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/context/booking-context";

// ============================================
// Select DateTime Page — Step 2
// Anti-AI: asymmetric calendar, amber accent, glass bottom bar
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

function getSlotIcon(hour: number): string {
  if (hour < 12) return "wb_sunny";
  if (hour < 17) return "wb_twilight";
  return "dark_mode";
}

function getSlotIconColor(hour: number): string {
  if (hour < 12) return "text-primary";
  if (hour < 17) return "text-orange-400";
  return "text-indigo-400";
}

function getPeriodLabel(hour: number): string {
  if (hour < 12) return "เช้า";
  if (hour < 17) return "บ่าย";
  return "เย็น";
}

function getPeriodRange(hour: number): string {
  if (hour < 12) return "00:00 - 12:00";
  if (hour < 17) return "12:00 - 17:00";
  return "17:00+";
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

  const isPrevDisabled = currentMonth <= new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-px bg-primary/40" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">ขั้นตอนที่ 2</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">เลือกวันและเวลา</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {booking.serviceName ? (
              <>
                บริการ: <span className="text-primary">{booking.serviceName}</span>
              </>
            ) : (
              "เลือกวันและเวลาที่สะดวก"
            )}
          </p>
        </div>

        {/* ===== Calendar ===== */}
        <div className="rounded-xl bg-card border border-border p-4 mb-6 card-tilt-2">
          {/* Month header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              disabled={isPrevDisabled}
            >
              <span className={`material-symbols-outlined text-lg ${isPrevDisabled ? "text-[#333]" : "text-foreground/80"}`}>
                chevron_left
              </span>
            </button>
            <h3 className="font-semibold text-lg text-foreground">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
            </h3>
            <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <span className="material-symbols-outlined text-lg text-foreground/80">chevron_right</span>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
              <div
                key={i}
                className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : "text-muted-foreground"}`}
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
                      ? "text-muted-foreground/60 cursor-not-allowed"
                      : isSelected
                      ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(15,118,110,0.25)]"
                      : isToday
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : isSunday
                      ? "text-red-400 hover:bg-muted"
                      : "text-foreground/80 hover:bg-muted"
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
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h3 className="font-semibold text-foreground">{formatThaiDate(selectedDate)}</h3>
            </div>

            {/* Loading */}
            {loadingAvail && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-card border border-border p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-20 mb-3" />
                    <div className="flex gap-2">
                      <div className="w-20 h-9 bg-muted rounded-lg" />
                      <div className="w-20 h-9 bg-muted rounded-lg" />
                      <div className="w-20 h-9 bg-muted rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {availError && !loadingAvail && (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-red-400 text-5xl mb-3 block">error_outline</span>
                <p className="text-red-400">{availError}</p>
              </div>
            )}

            {/* Closed */}
            {availability?.isClosed && !loadingAvail && (
              <div className="text-center py-8 rounded-xl bg-card border border-border">
                <span className="material-symbols-outlined text-muted-foreground text-5xl mb-3 block">dark_mode</span>
                <p className="text-muted-foreground font-medium">{availability.message || "ร้านปิดทำการในวันนี้"}</p>
                {availability.holidayName && (
                  <p className="text-sm text-muted-foreground mt-1">{availability.holidayName}</p>
                )}
              </div>
            )}

            {/* Slots */}
            {availability && !availability.isClosed && !loadingAvail && (
              <div className="space-y-5">
                {(
                  [
                    { slots: slotsByPeriod.morning, hour: 9 },
                    { slots: slotsByPeriod.afternoon, hour: 13 },
                    { slots: slotsByPeriod.evening, hour: 18 },
                  ] as const
                ).filter((g) => g.slots.length > 0).map((group, gi) => (
                  <div
                    key={gi}
                    className="rounded-xl bg-card border border-border p-4"
                    style={{ transform: `rotate(${gi % 2 === 0 ? "-0.2deg" : "0.15deg"})` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`material-symbols-outlined text-base ${getSlotIconColor(group.hour)}`}>
                        {getSlotIcon(group.hour)}
                      </span>
                      <span className="text-sm font-medium text-foreground/80">{getPeriodLabel(group.hour)}</span>
                      <span className="text-xs text-muted-foreground">{getPeriodRange(group.hour)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.slots.map((slot) => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => handleSlotClick(slot)}
                          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedSlot === slot.time
                              ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(15,118,110,0.25)]"
                              : slot.available
                              ? "bg-secondary text-foreground/90 hover:bg-muted border border-[#333]"
                              : "bg-background text-muted-foreground/60 cursor-not-allowed border border-[#1a1a1f] line-through"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* No slots */}
                {availability.slots.length === 0 && (
                  <div className="text-center py-8 rounded-xl bg-card border border-border">
                    <span className="material-symbols-outlined text-muted-foreground text-5xl mb-3 block">schedule</span>
                    <p className="text-muted-foreground">ไม่มีช่วงเวลาให้บริการในวันนี้</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No date selected prompt */}
        {!selectedDate && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-muted-foreground/60 text-6xl mb-3 block">calendar_month</span>
            <p className="text-muted-foreground">กรุณาเลือกวันที่ต้องการจอง</p>
          </div>
        )}
      </div>

      {/* ===== Bottom Bar — Glass Morphism ===== */}
      <div className="fixed bottom-0 left-0 right-0 glass-bar border-t border-border p-4 z-40">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div className="text-sm">
            {selectedDate && selectedSlot ? (
              <p>
                <span className="text-muted-foreground">เลือก: </span>
                <span className="text-primary font-medium">
                  {formatThaiDate(selectedDate)} เวลา {selectedSlot} น.
                </span>
              </p>
            ) : selectedDate ? (
              <p className="text-muted-foreground">กรุณาเลือกเวลา</p>
            ) : (
              <p className="text-muted-foreground">กรุณาเลือกวันและเวลา</p>
            )}
          </div>
          <button
            disabled={!selectedDate || !selectedSlot}
            onClick={handleNext}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
              selectedDate && selectedSlot
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_16px_rgba(15,118,110,0.25)]"
                : "bg-card text-muted-foreground cursor-not-allowed border border-border"
            }`}
          >
            ถัดไป
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
