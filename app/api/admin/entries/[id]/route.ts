import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin/guard";
import { overrideSchema, resolveOverride } from "@/app/lib/admin/override";

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/admin/entries/[id]">
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 415 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = overrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const entry = await prisma.entry.findUnique({
    where: { id },
    select: { id: true, status: true, aiCaption: true },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = resolveOverride(entry, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Caption required to approve this entry", fields: { caption: ["Required"] } },
      { status: 400 }
    );
  }

  const adminUser = process.env.ADMIN_USERNAME ?? "admin";
  const [updated] = await prisma.$transaction([
    prisma.entry.update({
      where: { id },
      data: { ...result.data, overriddenBy: adminUser, overriddenAt: new Date() },
      select: { id: true, status: true, slug: true, aiCaption: true, adminNote: true },
    }),
    prisma.entryEvent.create({
      data: {
        entryId: id,
        type: "admin_override",
        fromStatus: entry.status,
        toStatus: result.data.status,
        meta: JSON.stringify({ by: adminUser, note: result.data.adminNote }),
      },
    }),
  ]);

  revalidatePath("/admin");
  if (updated.slug) {
    revalidatePath(`/entry/${updated.slug}`);
  }

  return NextResponse.json({ ok: true, entry: updated });
}
