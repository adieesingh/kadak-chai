import { Suspense } from "react";
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

async function EntryContent({ params }: { params: PageProps<"/entry/[slug]">["params"] }) {
  const { slug } = await params;
  const entry = await getEntry(slug);
  if (!entry || !entry.aiCaption) notFound();

  const author = firstName(entry.name);

  return (
    <div className="max-w-md w-full space-y-4 sm:space-y-6">
      <article className="relative bg-amber-50 border-3 sm:border-4 border-amber-950/90 rounded-2xl sm:rounded-3xl p-5 xs:p-6 sm:p-10 text-center shadow-xl space-y-4 sm:space-y-6 overflow-hidden">
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 text-amber-950/20 text-xs font-mono select-none">✦</div>
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 text-amber-950/20 text-xs font-mono select-none">✦</div>
        <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 text-amber-950/20 text-xs font-mono select-none">✦</div>
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 text-amber-950/20 text-xs font-mono select-none">✦</div>

        <div className="inline-flex items-center gap-1.5 bg-amber-900 text-amber-50 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-black tracking-widest uppercase shadow-2xs">
          <span>☕</span>
          <span>#MyChaiBreak</span>
        </div>

        <blockquote className="my-3 sm:my-4 text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug sm:leading-snug text-amber-950 font-serif italic break-words">
          “{entry.aiCaption}”
        </blockquote>

        <div className="pt-3 sm:pt-2 border-t-2 border-dashed border-amber-900/20">
          <p className="text-sm sm:text-base font-bold text-stone-900 break-words">— {author}</p>
          <p className="text-[10px] sm:text-[11px] font-bold tracking-widest text-amber-900 uppercase mt-0.5">
            Kadak Chai Co. Poster Edition
          </p>
        </div>
      </article>

      <ShareActions slug={slug} name={author} caption={entry.aiCaption} />
    </div>
  );
}

export default function EntryPage(props: PageProps<"/entry/[slug]">) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-3.5 sm:p-8 bg-amber-50/50 min-h-[calc(100vh-8rem)]">
      <Suspense
        fallback={
          <div className="max-w-md w-full rounded-2xl sm:rounded-3xl border-2 border-amber-950/20 bg-amber-50 p-6 sm:p-8 text-center text-sm font-medium text-amber-950">
            Loading #MyChaiBreak poster...
          </div>
        }
      >
        <EntryContent params={props.params} />
      </Suspense>
    </main>
  );
}
