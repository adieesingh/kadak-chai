import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin/guard";
import { STATUSES, CATEGORIES } from "@/app/lib/admin/override";
import LoginForm from "./LoginForm";
import OverrideControls from "./OverrideControls";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-900 border-emerald-300",
  rejected: "bg-rose-100 text-rose-900 border-rose-300",
  pending: "bg-amber-100 text-amber-900 border-amber-300",
};

async function AdminContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  if (!(await isAdmin())) return <LoginForm />;

  const sp = await searchParams;
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
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 text-slate-900">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-950 mb-4">
          Entries ({entries.length})
        </h1>

        <nav className="flex flex-wrap items-center gap-2 mb-6 text-sm">
          <Link
            href={qs({ status: undefined })}
            className={`px-3 py-1 rounded-full border transition ${
              !status
                ? "bg-slate-900 text-white border-slate-900 font-semibold"
                : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
            }`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={qs({ status: s })}
              className={`px-3 py-1 rounded-full border capitalize transition ${
                status === s
                  ? "bg-slate-900 text-white border-slate-900 font-semibold"
                  : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {s}
            </Link>
          ))}
          <span className="mx-1 text-slate-400">|</span>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={qs({ category: category === c ? undefined : c })}
              className={`px-3 py-1 rounded-full border transition ${
                category === c
                  ? "bg-indigo-700 text-white border-indigo-700 font-semibold"
                  : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {c}
            </Link>
          ))}
        </nav>

        <ul className="space-y-4">
          {entries.map((e) => (
            <li
              key={e.id}
              className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-base font-bold text-slate-950">
                  {e.name}
                </strong>
                <span
                  className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                    STATUS_BADGE[e.status] ??
                    "bg-slate-200 text-slate-900 border-slate-300"
                  }`}
                >
                  {e.status}
                </span>
              </div>

              <div className="text-xs font-medium text-slate-600 mt-1">
                {e.city} · {e.contact} ·{" "}
                {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </div>

              <p className="my-3 text-sm leading-relaxed text-slate-900">
                {e.story}
              </p>

              <div className="text-xs bg-slate-100 border border-slate-200 text-slate-800 rounded px-3 py-2">
                <span className="font-semibold text-slate-950">AI:</span>{" "}
                {e.aiDecision ?? "—"} / {e.aiCategory ?? "—"}
                {e.aiReason && (
                  <>
                    {" "}
                    · <span className="font-semibold">reason:</span> {e.aiReason}
                  </>
                )}
                {e.aiError && (
                  <span className="text-rose-700 font-medium">
                    {" "}
                    · error: {e.aiError}
                  </span>
                )}
                {e.aiCaption && (
                  <>
                    {" "}
                    · <span className="font-semibold">caption:</span> “
                    {e.aiCaption}”
                  </>
                )}
              </div>

              {e.overriddenAt && (
                <div className="text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded px-2.5 py-1 mt-2">
                  Overridden by {e.overriddenBy}{" "}
                  {e.adminNote && `· ${e.adminNote}`}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <OverrideControls
                  id={e.id}
                  status={e.status}
                  hasCaption={!!e.aiCaption}
                />
                {e.status === "approved" && (
                  <Link
                    className="text-xs font-semibold underline text-indigo-700 hover:text-indigo-950"
                    href={`/entry/${e.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View public page ↗
                  </Link>
                )}
              </div>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="bg-white border border-slate-300 rounded-lg p-6 text-center text-sm font-medium text-slate-700">
              No entries.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-300 text-sm">
          Loading admin...
        </main>
      }
    >
      <AdminContent searchParams={props.searchParams} />
    </Suspense>
  );
}