import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-100/70 text-stone-600">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl">🫖</span>
            <div>
              <p className="text-sm font-bold text-stone-900">
                Kadak Chai Co. — #MyChaiBreak
              </p>
              <p className="text-xs text-stone-500">
                Crafted with ginger, cardamom, and love for chai lovers everywhere.
              </p>
            </div>
          </div>

          <div className="text-xs text-stone-500 flex flex-wrap items-center justify-center gap-4">
            <Link href="/" className="hover:text-stone-900 transition">
              Campaign Home
            </Link>
            <span>·</span>
            <Link href="/admin" className="hover:text-stone-900 transition">
              Admin Moderation
            </Link>
            <span>·</span>
            <span>© {new Date().getFullYear()} Kadak Chai Co.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
