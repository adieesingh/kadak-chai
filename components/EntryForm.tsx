"use client";
import { useState } from "react";
import { entryInputSchema, normalizeContact } from "@/app/lib/validation";

const MAX_STORY = 300;
type Errors = Partial<Record<"name" | "city" | "contact" | "story" | "consent", string>>;

const input =
  "w-full border-2 border-amber-900/30 focus:border-amber-900 rounded-lg px-3 py-3 text-base bg-white outline-none";

export default function EntryForm() {
  const [story, setStory] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { message: string }>(null);

  const used = [...story].length; // code points, same as the server

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setFormError("");

    const fd = new FormData(e.currentTarget);
    const values = {
      name: String(fd.get("name") ?? ""),
      city: String(fd.get("city") ?? ""),
      contact: String(fd.get("contact") ?? ""),
      story: String(fd.get("story") ?? ""),
      consent: fd.get("consent") === "on",
    };

    // Client-side validation (UX only. The server validates again.)
    const parsed = entryInputSchema.safeParse(values);
    const fieldErrors: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
    }
    if (!fieldErrors.contact && !normalizeContact(values.contact)) {
      fieldErrors.contact = "Enter a valid email or phone number";
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
          return; // keep the button disabled while navigating
        }
        setDone({ message: data.message ?? "Thanks! We're reviewing your entry." });
      } else if (res.status === 400 && data.fields) {
        const serverErrors: Errors = {};
        for (const [k, v] of Object.entries(data.fields as Record<string, string[]>)) {
          if (v?.[0]) serverErrors[k as keyof Errors] = v[0];
        }
        setErrors(serverErrors);
      } else if (res.status === 409) {
        setFormError("This email or phone number has already entered.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Network problem. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="text-center border-4 border-amber-900 bg-white rounded-xl p-8">
        <p className="text-4xl mb-3">☕</p>
        <p className="text-lg font-semibold">{done.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field label="Your name" error={errors.name}>
        <input name="name" autoComplete="name" maxLength={60} className={input} aria-invalid={!!errors.name} />
      </Field>

      <Field label="City" error={errors.city}>
        <input name="city" autoComplete="address-level2" maxLength={60} className={input} aria-invalid={!!errors.city} />
      </Field>

      <Field label="Email or phone" error={errors.contact}>
        <input name="contact" autoComplete="email" inputMode="email" maxLength={100} className={input} aria-invalid={!!errors.contact} />
      </Field>

      <Field label="Your chai break story" error={errors.story}>
        <textarea
          name="story"
          rows={5}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className={input}
          aria-invalid={!!errors.story}
        />
        <p className={`text-xs mt-1 text-right ${used > MAX_STORY ? "text-red-600 font-semibold" : "text-amber-800"}`}>
          {used}/{MAX_STORY}
        </p>
      </Field>

      <div>
        <label className="flex items-start gap-3 min-h-11 py-1">
          <input type="checkbox" name="consent" className="mt-1 h-5 w-5 shrink-0" aria-invalid={!!errors.consent} />
          <span className="text-sm">
            I agree that Kadak Chai Co. may feature my first name and story caption publicly.
          </span>
        </label>
        {errors.consent && <p role="alert" className="text-sm text-red-600">{errors.consent}</p>}
      </div>

      {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full min-h-12 rounded-lg bg-amber-900 text-white font-semibold text-base disabled:opacity-60"
      >
        {busy ? "Brewing your caption…" : "Share my chai break"}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {error && <span role="alert" className="block text-sm text-red-600 mt-1">{error}</span>}
    </label>
  );
}
