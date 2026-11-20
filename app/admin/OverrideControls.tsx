"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "approved" | "rejected" | "pending_review";

const BUTTON_CONFIG: Record<Status, { label: string; className: string }> = {
  approved: {
    label: "Approve",
    className:
      "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-600 hover:border-emerald-700",
  },
  rejected: {
    label: "Reject",
    className:
      "bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-600 hover:border-rose-700",
  },
  pending_review: {
    label: "Mark Pending",
    className:
      "bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-600 hover:border-amber-700",
  },
};

export default function OverrideControls({
  id,
  status,
  hasCaption,
}: {
  id: string;
  status: string;
  hasCaption: boolean;
}) {
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
    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
      {(["approved", "rejected", "pending_review"] as Status[])
        .filter((s) => s !== status)
        .map((s) => {
          const cfg = BUTTON_CONFIG[s];
          return (
            <button
              key={s}
              disabled={busy}
              onClick={() => set(s)}
              className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[32px] sm:min-h-0 flex items-center justify-center touch-manipulation ${cfg.className}`}
            >
              {cfg.label}
            </button>
          );
        })}
      {error && (
        <span
          role="alert"
          className="text-xs font-semibold bg-rose-50 border border-rose-300 text-rose-900 px-2 py-0.5 rounded break-words"
        >
          {error}
        </span>
      )}
    </div>
  );
}
