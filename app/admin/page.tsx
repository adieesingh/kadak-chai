import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin/guard";
import { STATUSES, CATEGORIES } from "@/app/lib/admin/override";
import LoginForm from "./LoginForm";
import OverrideControls from "./OverrideControls";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage(props: PageProps<"/admin">) {
  if (!(await isAdmin())) return <LoginForm />;

  const sp = await props.searchParams;
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
    <main className="p-4 max-w-5xl mx-auto text-gray-900">
      <h1 className="text-xl font-bold mb-3">Entries ({entries.length})</h1>

      <nav className="flex flex-wrap gap-2 mb-4 text-sm">
        <Link
          href={qs({ status: undefined })}
          className={!status ? "font-bold underline text-gray-950" : "text-gray-700 hover:text-gray-950"}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={qs({ status: s })}
            className={status === s ? "font-bold underline text-gray-950" : "text-gray-700 hover:text-gray-950"}
          >
            {s}
          </Link>
        ))}
        <span className="mx-2 text-gray-500">|</span>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={qs({ category: category === c ? undefined : c })}
            className={category === c ? "font-bold underline text-gray-950" : "text-gray-700 hover:text-gray-950"}
          >
            {c}
          </Link>
        ))}
      </nav>

      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.id} className="border border-gray-300 rounded p-3">
            <div className="flex justify-between gap-2 text-sm">
              <strong className="text-gray-950">{e.name}</strong>
              <span className="font-medium text-gray-800">{e.status}</span>
            </div>
            <div className="text-xs text-gray-700">
              {e.city} · {e.contact} · {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
            </div>
            {/* React escapes these; never use dangerouslySetInnerHTML for user text */}
            <p className="my-2 text-gray-900">{e.story}</p>
            <div className="text-xs text-gray-800">
              AI: {e.aiDecision ?? "—"} / {e.aiCategory ?? "—"}
              {e.aiReason && <> · reason: {e.aiReason}</>}
              {e.aiError && <> · error: {e.aiError}</>}
              {e.aiCaption && <> · caption: “{e.aiCaption}”</>}
            </div>
            {e.overriddenAt && (
              <div className="text-xs text-gray-700">
                overridden by {e.overriddenBy} {e.adminNote && `· ${e.adminNote}`}
              </div>
            )}
            {e.status === "approved" && (
              <Link
                className="text-xs underline text-gray-800 hover:text-gray-950"
                href={`/entry/${e.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                view public page
              </Link>
            )}
            <OverrideControls id={e.id} status={e.status} hasCaption={!!e.aiCaption} />
          </li>
        ))}
        {entries.length === 0 && <li className="text-gray-700">No entries.</li>}
      </ul>
    </main>
  );
}