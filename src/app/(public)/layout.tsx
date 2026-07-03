"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BookingProvider, useBooking } from "@/lib/context/booking-context";

// ============================================
// Stepper Component — shows booking progress
// ============================================

const STEP_ICONS = ["content_cut", "calendar_month", "person", "check_circle"];
const STEP_LABELS = ["บริการ", "วันเวลา", "พนักงาน", "ยืนยัน"];

function Stepper() {
  const { currentStep } = useBooking();

  return (
    <div className="w-full bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto max-w-2xl px-4 py-3">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, idx) => (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`step-dot w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx < currentStep
                      ? "bg-emerald-500 text-white"
                      : idx === currentStep
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {idx < currentStep ? (
                    <span className="material-symbols-outlined text-base">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-base">{STEP_ICONS[idx]}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    idx <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 mt-[-0.75rem]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      idx < currentStep ? "bg-emerald-500" : "bg-border"
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
// Public Layout — Light-first Teal
// ============================================
function PublicLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBookingFlow = pathname.startsWith("/book/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Public Header — Glass morphism, light mode default */}
      <header className="sticky top-0 z-50 w-full border-b border-border glass-bar">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
            <span className="material-symbols-outlined text-primary">queue</span>
            <span>
              <span className="text-primary">Queue</span>
              <span>Now</span>
            </span>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/" className="text-muted-foreground hover:text-primary transition-colors">
              หน้าแรก
            </a>
            <a href="/book/select-service" className="text-muted-foreground hover:text-primary transition-colors">
              จองคิว
            </a>
            <a href="/track" className="text-muted-foreground hover:text-primary transition-colors">
              ติดตามคิว
            </a>
          </nav>
        </div>
      </header>

      {/* Stepper — only on booking flow */}
      {isBookingFlow && <Stepper />}

      {/* Page Content */}
      <main className="flex-1">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <span className="material-symbols-outlined material-icon-spin text-primary text-4xl">progress_activity</span>
          </div>
        }>
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
