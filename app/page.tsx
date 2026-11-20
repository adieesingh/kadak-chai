import EntryForm from "@/components/EntryForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "#MyChaiBreak | Kadak Chai Co.",
  description: "Share your chai break story and get your own shareable poster line.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 px-4 py-8">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-6">
          <p className="text-sm font-semibold tracking-widest text-amber-900">
            ☕ KADAK CHAI CO.
          </p>
          <h1 className="text-3xl font-extrabold mt-2 text-stone-950">
            #MyChaiBreak
          </h1>
          <p className="mt-3 text-stone-700 leading-relaxed">
            Tell us about your favourite chai break. We&apos;ll turn it into a poster line you can share.
          </p>
        </header>
        <EntryForm />
        <p className="text-xs text-center text-stone-600 mt-6">
          Kadak Chai Co. is a fictional brand created for this campaign.
        </p>
      </div>
    </main>
  );
}