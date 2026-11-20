import { z } from "zod";

export const STATUSES = ["approved", "rejected", "pending_review"] as const;
export const CATEGORIES = ["funny", "nostalgic", "wholesome", "other"] as const;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export const overrideSchema = z.object({
  status: z.enum(STATUSES),
  // Agar bina AI caption wali entry approve karni ho tabhi manual caption zaroori hai
  caption: z
    .string()
    .trim()
    .max(200)
    .refine((s) => s === "" || words(s) <= 12, "Caption must be 12 words or fewer")
    .optional(),
  note: z.string().trim().max(300).optional(),
});

export type OverrideInput = z.infer<typeof overrideSchema>;

export type OverrideResult =
  | { ok: true; data: { status: string; aiCaption?: string; adminNote: string | null } }
  | { ok: false; error: "caption_required" };

// Admin override logic: Approved entry me poster caption hona lazmi hai warna 404 aayega
export function resolveOverride(
  current: { aiCaption: string | null },
  input: OverrideInput
): OverrideResult {
  const data: { status: string; aiCaption?: string; adminNote: string | null } = {
    status: input.status,
    adminNote: input.note?.length ? input.note : null,
  };

  if (input.status === "approved") {
    const existing = current.aiCaption?.trim();
    const provided = input.caption?.trim();
    if (!existing && !provided) return { ok: false, error: "caption_required" };
    if (!existing && provided) data.aiCaption = provided;
  }
  return { ok: true, data };
}
