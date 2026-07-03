"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      localStorage.setItem("admin_token", data.data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.data.user));
      router.push("/admin");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Organic blob background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#2DD4BF]/5 blur-[100px]" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[80px]" style={{ animationDelay: "1s" }} />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(15,118,110,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.2) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Glitch hover on the card */}
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-xl shadow-black/20 transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5 group">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 relative">
              <span className="material-symbols-outlined text-3xl text-primary">admin_panel_settings</span>
              {/* Glitch ring */}
              <div className="absolute inset-0 rounded-2xl border border-primary/20 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">เข้าสู่ระบบผู้ดูแล</h1>
            <p className="text-sm text-muted-foreground mt-1 font-light">QueueNow Admin Panel</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/70">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kimdev.studio"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/40 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/70">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group/btn relative overflow-hidden"
            >
              {/* Glitch hover effect */}
              <span className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">login</span>
                    เข้าสู่ระบบ
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-muted-foreground/50 mt-6 font-mono">© 2026 KimDev Studio</p>
      </div>
    </div>
  );
}
