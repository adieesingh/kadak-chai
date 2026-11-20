import Link from "next/link";
import { prisma } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin/guard";
import { STATUSES, CATEGORIES } from "@/app/lib/admin/override";
import LoginForm from "./LoginForm";
import OverrideControls from "./OverrideControls";


export const metadata = { title: "Admin", robots: { index: false } };

type Props = { searchParams: Promise<{ status?: string; category?: string }> }; // Next 14: plain object

export default async function AdminPage({ searchParams }: Props) {
  if (!(await isAdmin())) return <LoginForm />;

  const sp = await searchParams;
  // only allow known values into the query
  const status = STATUSES.find((s) => s === sp.status);
  const category = CATEGORIES.find((c) => c === sp.category);

  const entries = await prisma.entry.findMany({
    where: { ...(status && { status }), ...(category && { aiCategory: category }) },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const next = { status, category, ...patch };
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/admin?${s}` : "/admin";
  };

  return (
    <main className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-3">Entries ({entries.length})</h1>

      <nav className="flex flex-wrap gap-2 mb-4 text-sm">
        <Link href={qs({ status: undefined })} className={!status ? "font-bold underline" : ""}>All</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={qs({ status: s })} className={status === s ? "font-bold underline" : ""}>
            {s}
          </Link>
        ))}
        <span className="mx-2">|</span>
        {CATEGORIES.map((c) => (
          <Link key={c} href={qs({ category: category === c ? undefined : c })} className={category === c ? "font-bold underline" : ""}>
            {c}
          </Link>
        ))}
      </nav>

      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.id} className="border rounded p-3">
            <div className="flex justify-between gap-2 text-sm">
              <strong>{e.name}</strong>
              <span>{e.status}</span>
            </div>
            <div className="text-xs text-gray-600">
              {e.city} · {e.contact} · {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
            </div>
            {/* React escapes these; never use dangerouslySetInnerHTML for user text */}
            <p className="my-2">{e.story}</p>
            <div className="text-xs text-gray-700">
              AI: {e.aiDecision ?? "—"} / {e.aiCategory ?? "—"}
              {e.aiReason && <> · reason: {e.aiReason}</>}
              {e.aiError && <> · error: {e.aiError}</>}
              {e.aiCaption && <> · caption: “{e.aiCaption}”</>}
            </div>
            {e.overriddenAt && (
              <div className="text-xs text-gray-500">
                overridden by {e.overriddenBy} {e.adminNote && `· ${e.adminNote}`}
              </div>
            )}
            {e.status === "approved" && (
              <a className="text-xs underline" href={`/entry/${e.slug}`} target="_blank" rel="noreferrer">view public page</a>
            )}
            <OverrideControls id={e.id} status={e.status} hasCaption={!!e.aiCaption} />
          </li>
        ))}
        {entries.length === 0 && <li className="text-gray-500">No entries.</li>}
      </ul>
    </main>
  );
}
