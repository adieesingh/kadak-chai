"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "approved" | "rejected" | "pending_review";

export default function OverrideControls({ id, status, hasCaption }: { id: string; status: string; hasCaption: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function set(next: Status) {
    setError("");
    let caption: string | undefined;
    if (next === "approved" && !hasCaption) {
      const c = window.prompt("This entry has no AI caption. Enter a caption (max 12 words):");
      if (!c) return;
      caption = c;
    }
    const note = window.prompt("Note (optional):") ?? undefined;
    setBusy(true);
    const res = await fetch(`/api/admin/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, caption, note }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else if (res.status === 401) location.reload();
    else {
      const j = await res.json().catch(() => ({}));
      setError(j?.fields?.caption?.[0] ?? j?.error ?? "Failed");
    }
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2 items-center">
      {(["approved", "rejected", "pending_review"] as Status[])
        .filter((s) => s !== status)
        .map((s) => (
          <button key={s} disabled={busy} onClick={() => set(s)} className="text-xs border rounded px-2 py-1 disabled:opacity-50">
            Mark {s}
          </button>
        ))}
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
