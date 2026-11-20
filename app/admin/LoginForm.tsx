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
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-xs space-y-3">
        <h1 className="text-lg font-bold">Admin login</h1>
        <input name="username" placeholder="Username" autoComplete="username" required className="w-full border p-2 rounded" />
        <input name="password" type="password" placeholder="Password" autoComplete="current-password" required className="w-full border p-2 rounded" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full bg-black text-white p-2 rounded disabled:opacity-50">
          {busy ? "..." : "Log in"}
        </button>
      </form>
    </main>
  );
}
