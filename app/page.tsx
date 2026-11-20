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
    <main className="flex-1 py-10 px-4 sm:px-6 bg-[#FAF7F2]">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-100/90 border border-amber-300 text-amber-950 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-2xs">
            <span>☕</span>
            <span>KADAK CHAI CO. CAMPAIGN</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-stone-950 tracking-tight leading-tight">
            Every Cup Has A Story. <br className="hidden sm:inline" />
            <span className="text-amber-900">What’s Yours?</span>
          </h1>

          <p className="text-stone-700 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Tell us about your favourite chai break. We&apos;ll brew it into a personalized poster line you can share with your chai crew.
          </p>

          {/* Quick Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="bg-white/80 border border-stone-200/90 rounded-2xl p-3.5 shadow-2xs"
              >
                <div className="text-2xl mb-1">{step.icon}</div>
                <h2 className="text-xs font-bold text-stone-900">{step.title}</h2>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <section aria-label="Submit Chai Story">
          <EntryForm />
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-center text-stone-500">
          Kadak Chai Co. is a creative campaign celebrating chai culture across India.
        </p>
      </div>
    </main>
  );
}
