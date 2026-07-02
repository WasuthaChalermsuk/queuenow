"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BookingProvider, useBooking } from "@/lib/context/booking-context";
import { Check, Scissors, CalendarDays, User, ClipboardCheck } from "lucide-react";

// ============================================
// Stepper Component — shows booking progress
// ============================================
function Stepper() {
  const { currentStep } = useBooking();

  const steps = [
    { label: "บริการ", icon: Scissors },
    { label: "วันเวลา", icon: CalendarDays },
    { label: "พนักงาน", icon: User },
    { label: "ยืนยัน", icon: ClipboardCheck },
  ];

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="container mx-auto max-w-2xl px-4 py-3">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    idx < currentStep
                      ? "bg-green-500 text-white"
                      : idx === currentStep
                      ? "bg-blue-600 text-white ring-2 ring-blue-400/30"
                      : "bg-slate-700 text-slate-500"
                  }`}
                >
                  {idx < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    idx <= currentStep ? "text-blue-400" : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 mt-[-0.75rem]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      idx < currentStep ? "bg-green-500" : "bg-slate-700"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Public Layout
// ============================================
function PublicLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBookingFlow = pathname.startsWith("/book/");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Public Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="material-symbols-outlined text-blue-400">queue</span>
            QueueNow
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/" className="hover:text-blue-400 transition-colors">
              หน้าแรก
            </a>
            <a href="/book/select-service" className="hover:text-blue-400 transition-colors">
              จองคิว
            </a>
            <a href="/track" className="hover:text-blue-400 transition-colors">
              ติดตามคิว
            </a>
          </nav>
        </div>
      </header>

      {/* Stepper — only on booking flow */}
      {isBookingFlow && <Stepper />}

      {/* Page Content */}
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" /></div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookingProvider>
      <PublicLayoutInner>{children}</PublicLayoutInner>
    </BookingProvider>
  );
}
