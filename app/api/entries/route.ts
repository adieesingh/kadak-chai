import { moderateStory } from "@/app/lib/ai";
import { prisma } from "@/app/lib/db";
import { entryInputSchema, normalizeContact } from "@/app/lib/validation";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req:Request){
        let body:unknown;
        try {
            body=await req.json();  
        } catch (error) {
            return NextResponse.json({error:"Invalid request"},{status:400})
        }

        const parsed = entryInputSchema.safeParse(body);
         if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // 3. Contact normalize
  const contact = normalizeContact(input.contact);
  if (!contact) {
    return NextResponse.json(
      { error: "Validation failed", fields: { contact: ["Enter a valid email or phone"] } },
      { status: 400 }
    );
  }

  // 4 + 5. Insert (unique constraint duplicate pakdega)
  let entry;
  try {
    entry = await prisma.entry.create({
      data: {
        slug: nanoid(16),
        name: input.name,
        city: input.city,
        contact: contact.value,
        contactType: contact.type,
        story: input.story,
        consent: input.consent,
        status: "pending_review",
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "This email/phone has already entered." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // 6. AI step, kabhi throw nahi karega (result object return karta hai)
  const result = await moderateStory(input.story);

  if (result.ok) {
    await prisma.entry.update({
      where: { id: entry.id },
      data: {
        status: result.data.decision,           // "approved" | "rejected"
        aiDecision: result.data.decision,
        aiReason: result.data.reason ?? null,
        aiCategory: result.data.category,
        aiCaption: result.data.caption,
        aiProvider: result.provider,
      },
    });
  } else {
    await prisma.entry.update({
      where: { id: entry.id },
      data: { aiError: result.error, aiRaw: result.raw ?? null, aiProvider: result.provider },
    }); // status pending_review hi rehta hai
  }

  // 7. Response: user ko minimum info
  const approved = result.ok && result.data.decision === "approved";
  return NextResponse.json(
    approved
      ? { ok: true, status: "approved", shareUrl: `/entry/${entry.slug}` }
      : { ok: true, status: "received", message: "Thanks! We're reviewing your entry." },
    { status: 201 }
  );
}