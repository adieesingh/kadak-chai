"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Status = "approved" | "rejected" | "pending_review";

const BUTTON_CONFIG: Record<Status, { label: string; className: string; icon: string }> = {
  approved: {
    label: "Approve",
    icon: "✓",
    className:
      "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-600 hover:border-emerald-700",
  },
  rejected: {
    label: "Reject",
    icon: "✕",
    className:
      "bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-600 hover:border-rose-700",
  },
  pending_review: {
    label: "Mark Pending",
    icon: "⏳",
    className:
      "bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-600 hover:border-amber-700",
  },
};

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

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
  const [modalTarget, setModalTarget] = useState<Status | null>(null);
  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  function openModal(next: Status) {
    setModalTarget(next);
    setCaption("");
    setNote("");
    setFormError("");
  }

  function closeModal() {
    if (busy) return;
    setModalTarget(null);
    setFormError("");
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && modalTarget && !busy) {
        closeModal();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalTarget, busy]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!modalTarget || busy) return;

    setFormError("");
    setActionError("");

    const trimmedCaption = caption.trim();
    const words = countWords(trimmedCaption);

    if (modalTarget === "approved" && !hasCaption && !trimmedCaption) {
      setFormError("A poster caption is required to approve this entry.");
      return;
    }

    if (trimmedCaption && words > 12) {
      setFormError(`Caption must be 12 words or fewer (currently ${words} words).`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: modalTarget,
          caption: trimmedCaption || undefined,
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        closeModal();
        router.refresh();
      } else if (res.status === 401) {
        location.reload();
      } else {
        const j = await res.json().catch(() => ({}));
        setFormError(j?.fields?.caption?.[0] ?? j?.error ?? "Failed to update entry.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const wordCount = countWords(caption);

  return (
    <>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
        {(["approved", "rejected", "pending_review"] as Status[])
          .filter((s) => s !== status)
          .map((s) => {
            const cfg = BUTTON_CONFIG[s];
            return (
              <button
                key={s}
                disabled={busy}
                onClick={() => openModal(s)}
                className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[32px] sm:min-h-0 flex items-center justify-center gap-1 touch-manipulation ${cfg.className}`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
              </button>
            );
          })}
        {actionError && (
          <span
            role="alert"
            className="text-xs font-semibold bg-rose-50 border border-rose-300 text-rose-900 px-2 py-0.5 rounded break-words"
          >
            {actionError}
          </span>
        )}
      </div>

      {modalTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            ref={modalRef}
            className="bg-white border-2 border-stone-200 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 relative text-stone-900 text-left"
          >
            <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-stone-950">
                  {modalTarget === "approved"
                    ? "Approve Chai Story"
                    : modalTarget === "rejected"
                    ? "Reject Chai Story"
                    : "Mark as Pending Review"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update entry moderation status and record an optional audit note.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={busy}
                className="text-stone-400 hover:text-stone-700 rounded-lg p-1 text-sm font-bold transition cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirm} className="space-y-4">
              {modalTarget === "approved" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Poster Caption {hasCaption ? "(Optional Override)" : "(Required)"}
                    </label>
                    <span
                      className={`text-[11px] font-semibold ${
                        wordCount > 12 ? "text-rose-600 font-bold" : "text-stone-500"
                      }`}
                    >
                      {wordCount} / 12 words
                    </span>
                  </div>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={
                      hasCaption
                        ? "Keep AI caption or type new one..."
                        : "e.g. Garam chai, kadak yaadein..."
                    }
                    className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-900 focus:bg-white rounded-xl px-3.5 py-2 text-stone-900 text-sm outline-none transition"
                    maxLength={200}
                    autoFocus={!hasCaption}
                  />
                  {!hasCaption && (
                    <p className="text-[11px] text-amber-900 mt-1">
                      ⚠️ This submission does not have an AI caption. An approved poster requires a caption of 12 words or fewer.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Admin Audit Note <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Approved after verifying story context; high quality memory."
                  rows={2}
                  maxLength={300}
                  className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-900 focus:bg-white rounded-xl p-3 text-stone-900 text-sm outline-none transition resize-none leading-relaxed"
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-300 text-rose-950 text-xs font-semibold p-2.5 rounded-xl break-words"
                >
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-100 border border-stone-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || (modalTarget === "approved" && wordCount > 12)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ${
                    modalTarget === "approved"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : modalTarget === "rejected"
                      ? "bg-rose-700 hover:bg-rose-800"
                      : "bg-amber-800 hover:bg-amber-900"
                  }`}
                >
                  {busy ? "Saving..." : `Confirm ${BUTTON_CONFIG[modalTarget].label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
