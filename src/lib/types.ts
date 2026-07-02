// ============================================
// QueueNow — TypeScript Type Definitions
// ============================================

// String constants (replaces Prisma enums for SQLite)
export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  ARRIVED: "ARRIVED",
  SERVING: "SERVING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const AdminRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  SHOP_ADMIN: "SHOP_ADMIN",
  STAFF: "STAFF",
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export const DayOfWeek = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Booking Types
// ============================================

export interface BookingWithRelations {
  id: string;
  bookingNumber: string;
  bookingDate: Date;
  timeSlot: string;
  status: BookingStatus;
  queuePosition: number | null;
  totalPrice: number | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: Date;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    duration: number;
  };
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string | null;
    color: string | null;
  } | null;
  shop: {
    id: string;
    name: string;
  };
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  todayBookings: number;
  servingNow: number;
  waiting: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface QueueDisplay {
  currentNumber: string;
  currentStaff: string;
  currentService: string;
  waitingCount: number;
  nextInQueue: string[];
}

// ============================================
// Admin Types
// ============================================

export interface AdminSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  shopId: string | null;
  shopName: string | null;
}

// ============================================
// Customer Session (LINE Login)
// ============================================

export interface CustomerSession {
  id: string;
  firstName: string;
  lastName: string;
  lineUserId?: string | null;
}

// ============================================
// Time Slot Types
// ============================================

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  staffCount: number;
  maxSlots: number;
}
