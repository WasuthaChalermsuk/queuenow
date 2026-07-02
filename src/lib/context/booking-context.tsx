"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ============================================
// Booking Context — shared state for booking flow
// ============================================

export interface BookingState {
  serviceId: string | null;
  serviceName: string | null;
  servicePrice: number | null;
  serviceDuration: number | null;
  bookingDate: string | null; // YYYY-MM-DD
  timeSlot: string | null; // HH:mm
  staffId: string | null;
  staffName: string | null;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  shopId: string | null;
  shopName: string | null;
}

const initialState: BookingState = {
  serviceId: null,
  serviceName: null,
  servicePrice: null,
  serviceDuration: null,
  bookingDate: null,
  timeSlot: null,
  staffId: null,
  staffName: null,
  customerFirstName: "",
  customerLastName: "",
  customerPhone: "",
  customerEmail: "",
  notes: "",
  shopId: null,
  shopName: null,
};

interface BookingContextValue {
  booking: BookingState;
  setService: (id: string, name: string, price: number, duration: number) => void;
  setDateTime: (date: string, time: string) => void;
  setStaff: (id: string | null, name: string | null) => void;
  setCustomerInfo: (info: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
  }) => void;
  setShop: (id: string, name: string) => void;
  resetBooking: () => void;
  currentStep: number;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState>(initialState);

  const setService = useCallback(
    (id: string, name: string, price: number, duration: number) => {
      setBooking((prev) => ({ ...prev, serviceId: id, serviceName: name, servicePrice: price, serviceDuration: duration }));
    },
    []
  );

  const setDateTime = useCallback((date: string, time: string) => {
    setBooking((prev) => ({ ...prev, bookingDate: date, timeSlot: time }));
  }, []);

  const setStaff = useCallback((id: string | null, name: string | null) => {
    setBooking((prev) => ({ ...prev, staffId: id, staffName: name }));
  }, []);

  const setCustomerInfo = useCallback(
    (info: { firstName: string; lastName: string; phone: string; email: string; notes: string }) => {
      setBooking((prev) => ({
        ...prev,
        customerFirstName: info.firstName,
        customerLastName: info.lastName,
        customerPhone: info.phone,
        customerEmail: info.email,
        notes: info.notes,
      }));
    },
    []
  );

  const setShop = useCallback((id: string, name: string) => {
    setBooking((prev) => ({ ...prev, shopId: id, shopName: name }));
  }, []);

  const resetBooking = useCallback(() => {
    setBooking(initialState);
  }, []);

  // Calculate current step based on filled fields
  const currentStep = !booking.serviceId
    ? 0
    : !booking.bookingDate || !booking.timeSlot
    ? 1
    : booking.staffId === undefined || booking.staffId === null
    ? 2
    : 3;

  return (
    <BookingContext.Provider
      value={{
        booking,
        setService,
        setDateTime,
        setStaff,
        setCustomerInfo,
        setShop,
        resetBooking,
        currentStep,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
