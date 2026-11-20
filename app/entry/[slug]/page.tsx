import { prisma } from "@/app/lib/db";
import { firstName } from "@/app/lib/entry";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShareActions from "@/components/ShareActions";

async function getEntry(slug: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(slug)) return null;
  return prisma.entry.findFirst({
    where: { slug, status: "approved" },
    select: { name: true, aiCaption: true },
  });
}

export async function generateMetadata(
  props: PageProps<"/entry/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const entry = await getEntry(slug);
  if (!entry) return { title: "Not found | Kadak Chai Co." };
  return {
    title: `${firstName(entry.name)}'s #MyChaiBreak | Kadak Chai Co.`,
    description: entry.aiCaption ?? "",
    robots: { index: false },
  };
}

export default async function EntryPage(props: PageProps<"/entry/[slug]">) {
  const { slug } = await props.params;
  const entry = await getEntry(slug);
  if (!entry || !entry.aiCaption) notFound();

  const author = firstName(entry.name);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-amber-50/50">
      <div className="max-w-md w-full space-y-6">
        {/* The Collectible Chai Poster Card */}
        <article className="relative bg-amber-50 border-4 border-amber-950/90 rounded-3xl p-8 sm:p-10 text-center shadow-xl space-y-6 overflow-hidden">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 text-amber-950/20 text-xs font-mono">✦</div>
          <div className="absolute top-3 right-3 text-amber-950/20 text-xs font-mono">✦</div>
          <div className="absolute bottom-3 left-3 text-amber-950/20 text-xs font-mono">✦</div>
          <div className="absolute bottom-3 right-3 text-amber-950/20 text-xs font-mono">✦</div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-amber-900 text-amber-50 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
            <span>☕</span>
            <span>#MyChaiBreak</span>
          </div>

          {/* Large Quote */}
          <blockquote className="my-4 text-2xl sm:text-3xl font-extrabold leading-snug text-amber-950 font-serif italic">
            “{entry.aiCaption}”
          </blockquote>

          {/* Author Line */}
          <div className="pt-2 border-t-2 border-dashed border-amber-900/20">
            <p className="text-base font-bold text-stone-900">— {author}</p>
            <p className="text-[11px] font-bold tracking-widest text-amber-900 uppercase mt-0.5">
              Kadak Chai Co. Poster Edition
            </p>
          </div>
        </article>

        {/* Share & Actions */}
        <ShareActions slug={slug} name={author} caption={entry.aiCaption} />
      </div>
    </main>
  );
}
