"use client";
import { useState } from "react";
import { entryInputSchema, normalizeContact } from "@/app/lib/validation";

const MAX_STORY = 300;
type Errors = Partial<Record<"name" | "city" | "contact" | "story" | "consent", string>>;

const PROMPT_IDEAS = [
  "Monsoon tapri chai 🌧️",
  "3 AM late night study chai 📚",
  "4 PM office gossip break 💼",
  "Highway dhaba kulhad chai 🛣️",
];

export default function EntryForm() {
  const [story, setStory] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { message: string; shareUrl?: string }>(null);

  const used = [...story].length;
  const progressPercent = Math.min(100, Math.round((used / MAX_STORY) * 100));

  function addPrompt(text: string) {
    if (story.length === 0) {
      setStory(`My favourite chai break is ${text.toLowerCase()}: `);
    } else {
      setStory((prev) => `${prev} (${text})`);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setFormError("");

    const fd = new FormData(e.currentTarget);
    const values = {
      name: String(fd.get("name") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      contact: String(fd.get("contact") ?? "").trim(),
      story: story.trim(),
      consent: fd.get("consent") === "on",
    };

    const parsed = entryInputSchema.safeParse(values);
    const fieldErrors: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
    }
    if (!fieldErrors.contact && !normalizeContact(values.contact)) {
      fieldErrors.contact = "Enter a valid email or 10-digit phone number";
    }
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        if (data.status === "approved" && data.shareUrl) {
          window.location.assign(data.shareUrl);
          return;
        }
        setDone({
          message: data.message ?? "Thanks! We're reviewing your chai break entry.",
          shareUrl: data.shareUrl,
        });
      } else if (res.status === 400 && data.fields) {
        const serverErrors: Errors = {};
        for (const [k, v] of Object.entries(data.fields as Record<string, string[]>)) {
          if (v?.[0]) serverErrors[k as keyof Errors] = v[0];
        }
        setErrors(serverErrors);
      } else if (res.status === 409) {
        setFormError("This email or phone number has already entered.");
      } else {
        setFormError("Something went wrong while brewing. Please try again.");
      }
    } catch {
      setFormError("Network problem. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div
        role="status"
        className="text-center border-2 border-amber-900/30 bg-amber-50/60 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-sm space-y-4"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-amber-900 text-white flex items-center justify-center text-2xl sm:text-3xl shadow-sm">
          ☕
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
          Chai Story Received!
        </h2>
        <p className="text-stone-700 max-w-sm mx-auto leading-relaxed text-xs sm:text-sm">
          {done.message}
        </p>
        {done.shareUrl && (
          <a
            href={done.shareUrl}
            className="inline-flex items-center justify-center min-h-[44px] w-full sm:w-auto mt-2 bg-amber-900 hover:bg-amber-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition active:scale-98 touch-manipulation text-sm sm:text-base"
          >
            View Your Poster ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-stone-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm">
      <form onSubmit={onSubmit} noValidate className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <Field label="Your Name" error={errors.name} icon="👤">
            <input
              name="name"
              placeholder="e.g. Adarsh Sharma"
              autoComplete="name"
              maxLength={60}
              className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-900 focus:bg-white rounded-xl px-3.5 py-2.5 text-stone-900 text-base sm:text-sm outline-none transition"
              aria-invalid={!!errors.name}
            />
          </Field>

          <Field label="City" error={errors.city} icon="📍">
            <input
              name="city"
              placeholder="e.g. Varanasi, Lucknow"
              autoComplete="address-level2"
              maxLength={60}
              className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-900 focus:bg-white rounded-xl px-3.5 py-2.5 text-stone-900 text-base sm:text-sm outline-none transition"
              aria-invalid={!!errors.city}
            />
          </Field>
        </div>

        <Field label="Email or Phone Number" error={errors.contact} icon="✉️">
          <input
            name="contact"
            placeholder="you@email.com or 9876543210"
            autoComplete="email"
            inputMode="email"
            maxLength={100}
            className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-900 focus:bg-white rounded-xl px-3.5 py-2.5 text-stone-900 text-base sm:text-sm outline-none transition"
            aria-invalid={!!errors.contact}
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>☕</span> Your Chai Break Story
            </label>
            <span
              className={`text-xs font-semibold ${
                used > MAX_STORY ? "text-rose-600 font-bold" : "text-stone-500"
              }`}
            >
              {used} / {MAX_STORY}
            </span>
          </div>

          <textarea
            name="story"
            rows={4}
            value={story}
            placeholder="Tell us what makes your chai break memorable: who you drink it with, the place, the weather, the conversations..."
            onChange={(e) => setStory(e.target.value)}
            className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-900 focus:bg-white rounded-xl p-3 sm:p-3.5 text-stone-900 text-base sm:text-sm outline-none transition leading-relaxed resize-none"
            aria-invalid={!!errors.story}
          />

          <div className="w-full bg-stone-100 rounded-full h-1.5 sm:h-2 mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                used > MAX_STORY
                  ? "bg-rose-500"
                  : used > 250
                  ? "bg-amber-600"
                  : "bg-amber-800"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {errors.story && (
            <p role="alert" className="text-xs font-semibold text-rose-600 mt-1.5">
              {errors.story}
            </p>
          )}

          <div className="mt-3">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              💡 Need inspiration? Click to add:
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {PROMPT_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => addPrompt(idea)}
                  className="text-xs bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-950 border border-amber-200 px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer touch-manipulation select-none"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 sm:p-3.5 transition active:bg-stone-100/60">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="consent"
              className="mt-0.5 h-4 w-4 shrink-0 rounded text-amber-900 focus:ring-amber-900 border-stone-300 accent-amber-900 cursor-pointer"
              aria-invalid={!!errors.consent}
            />
            <span className="text-xs text-stone-700 leading-normal select-none">
              I agree that Kadak Chai Co. may feature my first name and generated poster line publicly.
            </span>
          </label>
          {errors.consent && (
            <p role="alert" className="text-xs font-semibold text-rose-600 mt-1.5 ml-7">
              {errors.consent}
            </p>
          )}
        </div>

        {formError && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-300 text-rose-950 text-xs font-semibold p-3 rounded-xl break-words"
          >
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[48px] sm:min-h-12 rounded-xl bg-amber-900 hover:bg-amber-800 active:scale-98 text-white font-bold text-sm sm:text-base shadow-sm transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 touch-manipulation px-4 py-3"
        >
          {busy ? (
            <>
              <span className="animate-spin text-lg">🫖</span>
              <span>Brewing Your Chai Caption…</span>
            </>
          ) : (
            <>
              <span>☕ Share My Chai Break</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </span>
      {children}
      {error && (
        <span role="alert" className="block text-xs font-semibold text-rose-600 mt-1.5">
          {error}
        </span>
      )}
    </label>
  );
}
