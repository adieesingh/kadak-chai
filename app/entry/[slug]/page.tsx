import { prisma } from "@/app/lib/db";
import { firstName } from "@/app/lib/entry";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> }; // Next 15. Next 14 mein params seedha object hai

async function getEntry(slug: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(slug)) return null; // junk slug DB tak nahi jaata
  return prisma.entry.findFirst({
    where: { slug, status: "approved" },
    select: { name: true, aiCaption: true }, // sirf jo public hai
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntry(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${firstName(entry.name)}'s #MyChaiBreak`,
    description: entry.aiCaption ?? "",
    robots: { index: false }, // personal pages search engine mein nahi chahiye
  };
}

export default async function EntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = await getEntry(slug);
  if (!entry || !entry.aiCaption) notFound();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-amber-50">
      <article className="max-w-md w-full text-center border-4 border-amber-900 p-8 bg-white">
        <p className="text-sm tracking-widest text-amber-800">☕ #MyChaiBreak</p>
        <blockquote className="my-8 text-2xl font-semibold leading-snug">
          “{entry.aiCaption}”
        </blockquote>
        <p className="text-lg">, {firstName(entry.name)}</p>
        <p className="text-xs mt-1 text-amber-800">Kadak Chai Co.</p>
      </article>
    </main>
  );
}