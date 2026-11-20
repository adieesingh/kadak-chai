import EntryForm from "@/components/EntryForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "#MyChaiBreak | Kadak Chai Co.",
  description:
    "Share your chai break story and get your own shareable poster line brewed by AI.",
};

const STEPS = [
  { icon: "✍️", title: "Share your break", desc: "Tell us about your daily cup, tapri memories, or chai buddy." },
  { icon: "✨", title: "AI brews caption", desc: "Our chai-tuned AI transforms your memory into a punchy poster quote." },
  { icon: "🖼️", title: "Download & share", desc: "Get your personalized badge to share on WhatsApp or stories." },
];

export default function Home() {
  return (
    <main className="flex-1 py-6 sm:py-10 px-3.5 sm:px-6 bg-[#FAF7F2]">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-10">
        <div className="text-center space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-amber-100/90 border border-amber-300 text-amber-950 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide shadow-2xs">
            <span>☕</span>
            <span>KADAK CHAI CO. CAMPAIGN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-950 tracking-tight leading-tight">
            Every Cup Has A Story. <br className="hidden sm:inline" />
            <span className="text-amber-900">What’s Yours?</span>
          </h1>

          <p className="text-stone-700 text-sm sm:text-base md:text-lg max-w-lg mx-auto leading-relaxed px-1 sm:px-0">
            Tell us about your favourite chai break. We&apos;ll brew it into a personalized poster line you can share with your chai crew.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2 sm:pt-3 text-left">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="bg-white/80 border border-stone-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-2xs flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
              >
                <div className="text-2xl mb-0 sm:mb-1 shrink-0">{step.icon}</div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-stone-900">{step.title}</h2>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section aria-label="Submit Chai Story">
          <EntryForm />
        </section>

        <p className="text-[11px] sm:text-xs text-center text-stone-500 px-4">
          Kadak Chai Co. is a creative campaign celebrating chai culture across India.
        </p>
      </div>
    </main>
  );
}
