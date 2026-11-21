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
    <main className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-3.5 sm:p-4 text-stone-900">
      <div className="w-full max-w-sm bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-2">
            <span>☕</span>
            <span>Kadak Chai Co.</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-950">Admin Portal</h1>
          <p className="text-xs font-medium text-stone-600 mt-1">
            Sign in with your brand credentials to moderate submissions.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Username
            </label>
            <input
              name="username"
              placeholder="e.g. brand"
              autoComplete="username"
              required
              className="w-full bg-stone-50 text-stone-950 placeholder:text-stone-400 border-2 border-stone-200 focus:border-amber-900 focus:bg-white focus:outline-none px-3.5 py-2.5 rounded-xl text-base sm:text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full bg-stone-50 text-stone-950 placeholder:text-stone-400 border-2 border-stone-200 focus:border-amber-900 focus:bg-white focus:outline-none px-3.5 py-2.5 rounded-xl text-base sm:text-sm transition"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="bg-rose-50 border border-rose-300 text-rose-950 text-xs font-semibold px-3 py-2.5 rounded-xl"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-12 bg-amber-900 hover:bg-amber-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm sm:text-base shadow-sm transition active:scale-98 disabled:opacity-50 cursor-pointer touch-manipulation"
          >
            {busy ? "Signing in..." : "Sign in to Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
