import { describe, expect, it } from "vitest";
import { overrideSchema, resolveOverride } from "@/app/lib/admin/override";

describe("overrideSchema", () => {
  it("accepts a valid status", () => {
    expect(overrideSchema.safeParse({ status: "approved" }).success).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(overrideSchema.safeParse({ status: "deleted" }).success).toBe(false);
  });

  it("rejects a caption over 12 words", () => {
    const caption = "one two three four five six seven eight nine ten eleven twelve thirteen";
    expect(overrideSchema.safeParse({ status: "approved", caption }).success).toBe(false);
  });
});

describe("resolveOverride", () => {
  it("approving an entry that already has a caption is fine", () => {
    const r = resolveOverride({ aiCaption: "Chai time" }, { status: "approved" });
    expect(r.ok).toBe(true);
  });

  it("approving an entry with no caption needs one (otherwise its public page would 404)", () => {
    expect(resolveOverride({ aiCaption: null }, { status: "approved" })).toEqual({
      ok: false,
      error: "caption_required",
    });
  });

  it("uses the admin's caption when the AI had none", () => {
    const r = resolveOverride({ aiCaption: null }, { status: "approved", caption: "Garam chai, garam baatein" });
    expect(r.ok && r.data.aiCaption).toBe("Garam chai, garam baatein");
  });

  it("does not overwrite an existing AI caption", () => {
    const r = resolveOverride({ aiCaption: "AI line" }, { status: "approved", caption: "Admin line" });
    expect(r.ok && r.data.aiCaption).toBeUndefined();
  });

  it("rejecting needs no caption and stores the note", () => {
    const r = resolveOverride({ aiCaption: null }, { status: "rejected", note: "spam" });
    expect(r.ok && r.data.adminNote).toBe("spam");
  });
});
