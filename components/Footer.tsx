import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-100/70 text-stone-600">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5">
            <span className="text-xl">🫖</span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900">
                Kadak Chai Co. — #MyChaiBreak
              </p>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Crafted with ginger, cardamom, and love for chai lovers everywhere.
              </p>
            </div>
          </div>

          <div className="text-xs text-stone-500 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1">
            <Link href="/" className="hover:text-stone-900 transition py-1">
              Campaign Home
            </Link>
            <span>·</span>
            <Link href="/admin" className="hover:text-stone-900 transition py-1">
              Admin Moderation
            </Link>
            <span>·</span>
            <span className="py-1">© 2026 Kadak Chai Co.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
