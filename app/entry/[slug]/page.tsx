import { prisma } from "@/app/lib/db";
import { firstName } from "@/app/lib/entry";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

async function getEntry(slug: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(slug)) return null; // junk slug DB tak nahi jaata
  return prisma.entry.findFirst({
    where: { slug, status: "approved" },
    select: { name: true, aiCaption: true }, // sirf jo public hai
  });
}

export async function generateMetadata(
  props: PageProps<"/entry/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const entry = await getEntry(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${firstName(entry.name)}'s #MyChaiBreak`,
    description: entry.aiCaption ?? "",
    robots: { index: false }, // personal pages search engine mein nahi chahiye
  };
}

export default async function EntryPage(props: PageProps<"/entry/[slug]">) {
  const { slug } = await props.params;
  const entry = await getEntry(slug);
  if (!entry || !entry.aiCaption) notFound();

  return (
  <main className="min-h-screen flex items-center justify-center p-6 bg-orange-100">
  <article className="max-w-md w-full text-center border-4 border-orange-950 p-8 bg-orange-50 text-stone-900">
    <p className="text-sm tracking-widest text-orange-800">☕ #MyChaiBreak</p>
    <blockquote className="my-8 text-2xl font-semibold leading-snug text-orange-950">
      “{entry.aiCaption}”
    </blockquote>
    <p className="text-lg text-stone-800"> {firstName(entry.name)}</p>
    <p className="text-xs mt-1 text-orange-800">Kadak Chai Co.</p>
  </article>
</main>
  );
}