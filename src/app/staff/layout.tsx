"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground animate-pulse">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col transition-transform ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <Link href="/staff" className="flex items-center gap-2.5 font-bold text-lg group">
            <span className="material-symbols-outlined text-primary text-2xl transition-transform group-hover:scale-110">event_available</span>
            <span className="tracking-tight">QueueNow</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <Link
            href="/staff"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
              pathname === "/staff"
                ? "bg-primary/10 text-primary border-l-[3px] border-primary pl-[9px]"
                : "text-muted-foreground hover:text-foreground hover:bg-card border-l-[3px] border-transparent pl-[9px]"
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${pathname === "/staff" ? "text-primary" : "text-muted-foreground"} transition-colors`}>
              event_available
            </span>
            ตารางคิวของฉัน
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              {user?.firstName?.[0] || "S"}
            </div>
            <div className="text-sm">
              <div className="font-medium">{user?.firstName || "พนักงาน"}</div>
              <div className="text-xs text-muted-foreground">{user?.role || ""}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-400 transition-colors w-full group"
          >
            <span className="material-symbols-outlined text-lg group-hover:text-red-400">logout</span>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 lg:px-6 bg-background/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
            หน้าร้าน
          </Link>
          <div className="flex-1" />
          <div className="text-xs text-muted-foreground font-mono hidden sm:block">
            QueueNow v1.0
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
