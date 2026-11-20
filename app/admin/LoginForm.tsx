"use client";
import { useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }),
    });
    setBusy(false);
    if (res.ok) location.reload();
    else setError(res.status === 429 ? "Too many attempts. Try later." : "Invalid credentials");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-3.5 sm:p-4 text-slate-900">
      <div className="w-full max-w-sm bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-8 shadow-md">
        <div className="mb-5 sm:mb-6">
          <p className="text-xs font-bold tracking-widest uppercase text-amber-900">
            ☕ Kadak Chai Co.
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1">Admin Portal</h1>
          <p className="text-xs font-medium text-slate-600 mt-1">
            Sign in with your admin credentials to manage submissions.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Username
            </label>
            <input
              name="username"
              placeholder="e.g. admin"
              autoComplete="username"
              required
              className="w-full bg-white text-slate-950 placeholder:text-slate-400 border-2 border-slate-300 focus:border-slate-950 focus:outline-none px-3.5 py-2.5 rounded-lg text-base sm:text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full bg-white text-slate-950 placeholder:text-slate-400 border-2 border-slate-300 focus:border-slate-950 focus:outline-none px-3.5 py-2.5 rounded-lg text-base sm:text-sm transition"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="bg-rose-50 border border-rose-300 text-rose-950 text-xs font-semibold px-3 py-2.5 rounded-lg"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[44px] bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm sm:text-base shadow-sm transition active:scale-98 disabled:opacity-50 cursor-pointer touch-manipulation"
          >
            {busy ? "Signing in..." : "Sign in to Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
