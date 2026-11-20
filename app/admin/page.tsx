import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin/guard";
import { STATUSES, CATEGORIES } from "@/app/lib/admin/override";
import LoginForm from "./LoginForm";
import LogoutButton from "./LogoutButton";
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
    <main className="min-h-screen bg-slate-50 p-3.5 sm:p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Moderation Dashboard
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Showing {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs sm:text-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Status:
            </span>
            <Link
              href={qs({ status: undefined })}
              className={`px-3 py-1 rounded-full border transition shrink-0 touch-manipulation ${
                !status
                  ? "bg-slate-900 text-white border-slate-900 font-semibold"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              All
            </Link>
            {STATUSES.map((s) => (
              <Link
                key={s}
                href={qs({ status: s })}
                className={`px-3 py-1 rounded-full border capitalize transition shrink-0 touch-manipulation ${
                  status === s
                    ? "bg-slate-900 text-white border-slate-900 font-semibold"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {s.replace("_", " ")}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs sm:text-sm border-t border-slate-100 pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Category:
            </span>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={qs({ category: category === c ? undefined : c })}
                className={`px-3 py-1 rounded-full border capitalize transition shrink-0 touch-manipulation ${
                  category === c
                    ? "bg-indigo-700 text-white border-indigo-700 font-semibold"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>

        <ul className="space-y-3 sm:space-y-4">
          {entries.map((e) => (
            <li
              key={e.id}
              className="bg-white border border-slate-200 sm:border-slate-300 rounded-xl sm:rounded-lg p-3.5 sm:p-5 shadow-xs sm:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <strong className="text-sm sm:text-base font-bold text-slate-950 break-words min-w-0">
                  {e.name}
                </strong>
                <span
                  className={`text-[10px] sm:text-xs font-semibold uppercase px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${
                    STATUS_BADGE[e.status] ??
                    "bg-slate-200 text-slate-900 border-slate-300"
                  }`}
                >
                  {e.status}
                </span>
              </div>

              <div className="text-[11px] sm:text-xs font-medium text-slate-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>📍 {e.city}</span>
                <span>·</span>
                <span className="break-all">✉️ {e.contact}</span>
                <span>·</span>
                <span>🕒 {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </div>

              <p className="my-2.5 sm:my-3 text-xs sm:text-sm leading-relaxed text-slate-900 break-words">
                {e.story}
              </p>

              <div className="text-[11px] sm:text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 sm:p-3 break-words space-y-1">
                <div>
                  <span className="font-bold text-slate-950">AI Decision:</span>{" "}
                  <span className="font-semibold">{e.aiDecision ?? "—"}</span>
                  {e.aiCategory && (
                    <span className="text-indigo-700 font-semibold ml-1.5">
                      [{e.aiCategory}]
                    </span>
                  )}
                </div>
                {e.aiReason && (
                  <div>
                    <span className="font-semibold text-slate-700">Reason:</span>{" "}
                    {e.aiReason}
                  </div>
                )}
                {e.aiError && (
                  <div className="text-rose-700 font-medium">
                    <span className="font-semibold">Error:</span> {e.aiError}
                  </div>
                )}
                {e.aiCaption && (
                  <div className="text-amber-950 font-serif italic pt-1">
                    <span className="font-sans font-semibold not-italic text-stone-700">Caption:</span> “
                    {e.aiCaption}”
                  </div>
                )}
              </div>

              {e.overriddenAt && (
                <div className="text-[11px] sm:text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2 break-words">
                  Overridden by {e.overriddenBy}{" "}
                  {e.adminNote && `· ${e.adminNote}`}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <OverrideControls
                  id={e.id}
                  status={e.status}
                  hasCaption={!!e.aiCaption}
                />
                {e.status === "approved" && (
                  <Link
                    className="text-xs font-bold underline text-indigo-700 hover:text-indigo-950 min-h-[32px] flex items-center touch-manipulation"
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
            <li className="bg-white border border-slate-300 rounded-xl p-8 text-center text-sm font-medium text-slate-700">
              No entries found for this filter.
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
        <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
          Loading admin...
        </main>
      }
    >
      <AdminContent searchParams={props.searchParams} />
    </Suspense>
  );
}
