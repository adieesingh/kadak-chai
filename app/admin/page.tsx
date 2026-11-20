import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin/guard";
import { STATUSES, CATEGORIES } from "@/app/lib/admin/override";
import LoginForm from "./LoginForm";
import OverrideControls from "./OverrideControls";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = { title: "Admin Portal", robots: { index: false } };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-950 border border-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-950 border border-rose-400",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-950 border border-amber-400",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-950 border border-amber-400",
  },
};

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
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-xs">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-amber-900">
              ☕ Kadak Chai Co.
            </p>
            <h1 className="text-2xl font-extrabold text-slate-950">
              Admin Portal
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg">
              Total: {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* Filter Navigation */}
        <nav className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider mr-1">
              Status:
            </span>
            <Link
              href={qs({ status: undefined })}
              className={`px-3 py-1.5 rounded-lg border transition ${
                !status
                  ? "bg-slate-950 text-white border-slate-950 font-bold shadow-2xs"
                  : "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-200 font-semibold"
              }`}
            >
              All
            </Link>
            {STATUSES.map((s) => {
              const label = s.replace("_", " ");
              const isSelected = status === s;
              return (
                <Link
                  key={s}
                  href={qs({ status: s })}
                  className={`px-3 py-1.5 rounded-lg border capitalize transition ${
                    isSelected
                      ? "bg-slate-950 text-white border-slate-950 font-bold shadow-2xs"
                      : "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-200 font-semibold"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs border-t border-slate-200 pt-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider mr-1">
              Category:
            </span>
            <Link
              href={qs({ category: undefined })}
              className={`px-3 py-1.5 rounded-lg border transition ${
                !category
                  ? "bg-indigo-900 text-white border-indigo-900 font-bold shadow-2xs"
                  : "bg-indigo-50/60 text-slate-800 border-indigo-200 hover:bg-indigo-100 font-semibold"
              }`}
            >
              All Categories
            </Link>
            {CATEGORIES.map((c) => {
              const isSelected = category === c;
              return (
                <Link
                  key={c}
                  href={qs({ category: isSelected ? undefined : c })}
                  className={`px-3 py-1.5 rounded-lg border capitalize transition ${
                    isSelected
                      ? "bg-indigo-900 text-white border-indigo-900 font-bold shadow-2xs"
                      : "bg-indigo-50/60 text-slate-800 border-indigo-200 hover:bg-indigo-100 font-semibold"
                  }`}
                >
                  {c}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Entries List */}
        <ul className="space-y-4">
          {entries.map((e) => {
            const badge = STATUS_BADGE[e.status] ?? {
              label: e.status,
              className: "bg-slate-200 text-slate-950 border border-slate-400",
            };

            return (
              <li
                key={e.id}
                className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-lg font-bold text-slate-950">
                    {e.name}
                  </strong>
                  <span
                    className={`text-xs font-bold px-3 py-0.5 rounded-full ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-700 mt-1 flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                  <span>📍 {e.city}</span>
                  <span className="text-slate-400">·</span>
                  <span>📞 {e.contact}</span>
                  <span className="text-slate-400">·</span>
                  <span>🗓 {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                </div>

                {/* User Story */}
                <div className="my-3 text-sm leading-relaxed text-slate-950 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <p className="font-normal text-slate-950 whitespace-pre-wrap">{e.story}</p>
                </div>

                {/* AI Analysis Block */}
                <div className="text-xs bg-slate-100 border border-slate-300 text-slate-900 rounded-xl p-3 space-y-1">
                  <div>
                    <span className="font-bold text-slate-950">AI Verdict:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {e.aiDecision ?? "—"}
                    </span>
                    {" "}·{" "}
                    <span className="font-bold text-slate-950">Category:</span>{" "}
                    <span className="font-semibold capitalize text-slate-900">
                      {e.aiCategory ?? "—"}
                    </span>
                  </div>

                  {e.aiReason && (
                    <div>
                      <span className="font-bold text-slate-950">Reason:</span>{" "}
                      <span className="text-slate-800">{e.aiReason}</span>
                    </div>
                  )}

                  {e.aiError && (
                    <div>
                      <span className="font-bold text-rose-800">Error:</span>{" "}
                      <span className="text-rose-900 font-semibold">{e.aiError}</span>
                    </div>
                  )}

                  {e.aiCaption && (
                    <div className="pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-950">Generated Caption:</span>{" "}
                      <span className="italic font-medium text-slate-950">
                        “{e.aiCaption}”
                      </span>
                    </div>
                  )}
                </div>

                {/* Override notice */}
                {e.overriddenAt && (
                  <div className="text-xs font-semibold text-amber-950 bg-amber-100 border border-amber-300 rounded-xl px-3.5 py-2 mt-3">
                    ✍️ Overridden by <span className="font-bold">{e.overriddenBy}</span>
                    {e.adminNote && <span> · Note: {e.adminNote}</span>}
                  </div>
                )}

                {/* Actions & Public Link */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <OverrideControls
                    id={e.id}
                    status={e.status}
                    hasCaption={!!e.aiCaption}
                  />

                  {e.status === "approved" && (
                    <Link
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-900 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 px-3 py-1.5 rounded-lg transition"
                      href={`/entry/${e.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Public Page ↗
                    </Link>
                  )}
                </div>
              </li>
            );
          })}

          {entries.length === 0 && (
            <li className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center text-sm font-semibold text-slate-700 shadow-xs">
              No entries found matching this filter.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
