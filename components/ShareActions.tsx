"use client";
import { useState } from "react";
import Link from "next/link";

export default function ShareActions({
  slug,
  name,
  caption,
}: {
  slug: string;
  name: string;
  caption: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = typeof window !== "undefined" ? window.location.href : `/entry/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  }

  const shareText = `Check out ${name}'s chai break poster: “${caption}” ☕ brewed by #MyChaiBreak Kadak Chai Co.`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${typeof window !== "undefined" ? window.location.href : ""}`
  )}`;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition active:scale-98 cursor-pointer"
        >
          <span>{copied ? "✓ Copied!" : "📋 Copy Link"}</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition active:scale-98"
        >
          <span>💬 WhatsApp</span>
        </a>
      </div>

      <Link
        href="/"
        className="w-full text-center py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-amber-100/80 hover:bg-amber-200/80 text-amber-950 border border-amber-300/80 transition"
      >
        ✨ Brew Your Own #MyChaiBreak Poster
      </Link>
    </div>
  );
}
