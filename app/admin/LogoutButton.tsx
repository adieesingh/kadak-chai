"use client";
import { useState } from "react";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <button
      onClick={onLogout}
      disabled={busy}
      className="text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 min-h-[32px] flex items-center justify-center touch-manipulation"
    >
      {busy ? "Logging out..." : "Log out"}
    </button>
  );
}
