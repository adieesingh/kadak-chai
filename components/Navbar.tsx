import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF7F2]/90 border-b border-stone-200/80">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 group transition-transform active:scale-95 shrink-0"
        >
          <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-900 text-white text-base sm:text-lg shadow-xs group-hover:bg-amber-800 transition">
            ☕
          </span>
          <div className="flex flex-col">
            <span className="font-extrabold text-stone-900 tracking-tight leading-none text-sm sm:text-lg">
              Kadak Chai <span className="text-amber-900">Co.</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-stone-500 uppercase mt-0.5">
              #MyChaiBreak
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-stone-100 transition whitespace-nowrap"
          >
            Share Story
          </Link>
          <Link
            href="/admin"
            className="text-xs sm:text-sm font-bold text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/80 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition whitespace-nowrap"
          >
            Admin<span className="hidden sm:inline"> Portal</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
