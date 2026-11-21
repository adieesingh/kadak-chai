import { describe, expect, it } from "vitest";
import { entryInputSchema, normalizeContact } from "@/app/lib/validation";

const good = {
  name: "Adarsh Singh",
  city: "Mumbai",
  contact: "adarsh@example.com",
  story: "Cutting chai at the tapri with my college friends.",
  consent: true,
};

describe("entryInputSchema (server-side validation)", () => {
  it("accepts a good entry", () => {
    expect(entryInputSchema.safeParse(good).success).toBe(true);
  });

  it("accepts a 300 character story and rejects 301", () => {
    expect(entryInputSchema.safeParse({ ...good, story: "a".repeat(300) }).success).toBe(true);
    expect(entryInputSchema.safeParse({ ...good, story: "a".repeat(301) }).success).toBe(false);
  });

  it("rejects missing or false consent", () => {
    expect(entryInputSchema.safeParse({ ...good, consent: false }).success).toBe(false);
    const withoutConsent: Partial<typeof good> = { ...good };
    delete withoutConsent.consent;
    expect(entryInputSchema.safeParse(withoutConsent).success).toBe(false);
  });

  it("rejects consent sent as a string", () => {
    expect(entryInputSchema.safeParse({ ...good, consent: "true" }).success).toBe(false);
  });

  it("rejects a name that is only spaces", () => {
    expect(entryInputSchema.safeParse({ ...good, name: "     " }).success).toBe(false);
  });

  it("rejects a too-short story", () => {
    expect(entryInputSchema.safeParse({ ...good, story: "chai" }).success).toBe(false);
  });

  it("rejects an empty body", () => {
    expect(entryInputSchema.safeParse({}).success).toBe(false);
  });
});

describe("normalizeContact", () => {
  it("lower-cases emails", () => {
    expect(normalizeContact("  Adarsh@Example.COM ")).toEqual({ type: "email", value: "adarsh@example.com" });
  });

  it("rejects a malformed email", () => {
    expect(normalizeContact("not-an-email@")).toBeNull();
  });

  it("strips spaces, dashes and brackets from phone numbers", () => {
    expect(normalizeContact("98765 43210")).toEqual({ type: "phone", value: "9876543210" });
    expect(normalizeContact("+91 (98765) 43-210")).toEqual({ type: "phone", value: "+919876543210" });
  });

  it("rejects too-short and non-numeric phone values", () => {
    expect(normalizeContact("12345")).toBeNull();
    expect(normalizeContact("abcdefghij")).toBeNull();
  });
});
