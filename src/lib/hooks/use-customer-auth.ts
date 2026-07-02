"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================
// QueueNow — Customer Auth Hook
// จัดการ LINE Login state สำหรับ frontend
// ============================================

const TOKEN_KEY = "customer_token";

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  lineUserId: string | null;
  createdAt: string | null;
}

interface CustomerAuthState {
  /** กำลังโหลดสถานะ login */
  loading: boolean;
  /** เข้าสู่ระบบแล้วหรือไม่ */
  isLoggedIn: boolean;
  /** ข้อมูลโปรไฟล์ลูกค้า (null ถ้ายังไม่ login) */
  customer: CustomerProfile | null;
  /** error message */
  error: string | null;
}

interface CustomerAuthActions {
  /** ไปที่ LINE OAuth Login (redirect) */
  login: (returnUrl?: string) => void;
  /** ออกจากระบบ */
  logout: () => void;
  /** โหลดข้อมูลลูกค้าใหม่ (ใช้หลังจาก token เปลี่ยน) */
  refresh: () => Promise<void>;
}

export function useCustomerAuth(): CustomerAuthState & CustomerAuthActions {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- อ่าน token จาก URL (หลัง LINE callback) และเก็บใน localStorage ---
  const captureTokenFromUrl = useCallback(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      // เก็บ token ลง localStorage
      localStorage.setItem(TOKEN_KEY, tokenFromUrl);

      // ลบ token ออกจาก URL (clean URL โดยไม่ reload)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("token");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, []);

  // --- ดึงข้อมูล customer จาก /api/me ---
  const fetchCustomer = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/me", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();

      if (data.success) {
        setCustomer(data.data);
        setError(null);
      } else {
        // Token หมดอายุหรือไม่ถูกต้อง
        localStorage.removeItem(TOKEN_KEY);
        setCustomer(null);
        setError(null);
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- ตรวจสอบ token ตอน mount ---
  useEffect(() => {
    captureTokenFromUrl();
    fetchCustomer();
  }, [captureTokenFromUrl, fetchCustomer]);

  // --- login: redirect ไป LINE OAuth ---
  const login = useCallback((returnUrl?: string) => {
    const currentPath = returnUrl || window.location.pathname + window.location.search;
    const loginUrl = `/api/auth/line?returnUrl=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }, []);

  // --- logout: ลบ token ---
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setCustomer(null);
    setError(null);
  }, []);

  const isLoggedIn = !!customer;

  return {
    loading,
    isLoggedIn,
    customer,
    error,
    login,
    logout,
    refresh: fetchCustomer,
  };
}
