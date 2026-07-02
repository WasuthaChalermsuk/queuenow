"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

export default function StaffLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/staff/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ firstName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;
    const token = localStorage.getItem("staff_token");
    const stored = localStorage.getItem("staff_user");
    if (!token) {
      router.push("/staff/login");
      return;
    }
    try {
      setUser(stored ? JSON.parse(stored) : null);
    } catch {}
    setLoading(false);
  }, [isLoginPage, router]);

  function logout() {
    localStorage.removeItem("staff_token");
    localStorage.removeItem("staff_user");
    localStorage.removeItem("staff_staffId");
    router.push("/staff/login");
  }

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
          <Link href="/staff" className="flex items-center gap-2 font-bold text-lg">
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
            <span>QueueNow</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/staff"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/staff"
                ? "bg-emerald-600/20 text-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            ตารางคิวของฉัน
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold">
              {user?.firstName?.[0] || "S"}
            </div>
            <div className="text-sm">
              <div className="font-medium">{user?.firstName || "พนักงาน"}</div>
              <div className="text-xs text-slate-500">{user?.role || ""}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-800 flex items-center px-4 gap-3 lg:px-6 bg-slate-900/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            หน้าร้าน
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
