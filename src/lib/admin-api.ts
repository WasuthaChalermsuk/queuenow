"use client";

// ============================================
// Admin API Client — จัดการ token + fetch
// ============================================

const TOKEN_KEY = "queuenow_admin_token";
const USER_KEY = "queuenow_admin_user";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  shopId: string | null;
  shopName: string | null;
}

// ---------- Token Management ----------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user: AdminUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  removeToken();
  removeUser();
  window.location.href = "/admin/login";
}

// ---------- API Fetch ----------

export async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  // Handle 401 — redirect to login
  if (res.status === 401) {
    removeToken();
    removeUser();
    window.location.href = "/admin/login";
    throw new Error("session_expired");
  }

  const json = await res.json();

  if (!res.ok && !json.success) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }

  return json;
}

// ---------- API Shortcuts ----------

export async function apiLogin(email: string, password: string) {
  const res = await adminFetch<{ token: string; user: AdminUser }>(
    "/api/admin/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );

  if (res.data?.token) {
    setToken(res.data.token);
    setUser(res.data.user);
  }

  return res;
}

export async function apiGetDashboard() {
  return adminFetch("/api/admin/dashboard");
}

export async function apiGetBookings(params?: {
  date?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set("date", params.date);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return adminFetch(`/api/admin/bookings${qs ? `?${qs}` : ""}`);
}

export async function apiUpdateBookingStatus(
  id: string,
  status: string,
  note?: string
) {
  return adminFetch(`/api/admin/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export async function apiGetServices() {
  return adminFetch("/api/admin/services?includeInactive=true");
}

export async function apiCreateService(data: {
  shopId: string;
  name: string;
  nameEn?: string;
  description?: string;
  duration: number;
  price?: number;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return adminFetch("/api/admin/services", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateService(
  id: string,
  data: {
    name?: string;
    nameEn?: string | null;
    description?: string | null;
    duration?: number;
    price?: number | null;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  return adminFetch(`/api/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteService(id: string) {
  return adminFetch(`/api/admin/services/${id}`, { method: "DELETE" });
}

export async function apiGetStaff() {
  return adminFetch("/api/admin/staff?includeInactive=true");
}

export async function apiCreateStaff(data: {
  shopId: string;
  code?: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  color?: string;
  isActive?: boolean;
  maxConcurrentBookings?: number;
  serviceIds?: string[];
}) {
  return adminFetch("/api/admin/staff", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateStaff(
  id: string,
  data: {
    code?: string | null;
    firstName?: string;
    lastName?: string;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    color?: string;
    isActive?: boolean;
    maxConcurrentBookings?: number;
    serviceIds?: string[];
  }
) {
  return adminFetch(`/api/admin/staff/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteStaff(id: string) {
  return adminFetch(`/api/admin/staff/${id}`, { method: "DELETE" });
}
