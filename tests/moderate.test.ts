import { describe, expect, it } from "vitest";
import { moderateStory } from "@/app/lib/ai";
import { mockProvider } from "@/app/lib/ai/providers/mock";
import type { AiProvider } from "@/app/lib/ai/providers/types";

/** Build a fake provider that returns text or throws. */
const providerReturning = (text: string): AiProvider => ({ name: "fake", complete: async () => text });
const providerThrowing = (err: unknown): AiProvider => ({
  name: "fake",
  complete: async () => {
    throw err;
  },
});

describe("moderateStory: failures never throw, they return ok:false", () => {
  it("maps a timeout", async () => {
    const e = Object.assign(new Error("t"), { name: "TimeoutError" });
    expect(await moderateStory("chai", providerThrowing(e))).toMatchObject({ ok: false, error: "timeout" });
  });

  it("maps an AbortError (our own timeout) to timeout", async () => {
    const e = Object.assign(new Error("a"), { name: "AbortError" });
    expect(await moderateStory("chai", providerThrowing(e))).toMatchObject({ ok: false, error: "timeout" });
  });

  it("maps HTTP 429 to rate_limited", async () => {
    const e = Object.assign(new Error("429"), { status: 429 });
    expect(await moderateStory("chai", providerThrowing(e))).toMatchObject({ ok: false, error: "rate_limited" });
  });

  it("maps another HTTP status to provider_error", async () => {
    const e = Object.assign(new Error("500"), { status: 500 });
    expect(await moderateStory("chai", providerThrowing(e))).toMatchObject({ ok: false, error: "provider_error" });
  });

  it("maps an unknown error to network_error", async () => {
    expect(await moderateStory("chai", providerThrowing(new Error("boom")))).toMatchObject({
      ok: false,
      error: "network_error",
    });
  });

  it("maps garbage text to invalid_json and keeps the raw reply", async () => {
    const r = await moderateStory("chai", providerReturning("I am not JSON"));
    expect(r).toMatchObject({ ok: false, error: "invalid_json", raw: "I am not JSON" });
  });

  it("maps wrong values to invalid_schema", async () => {
    const r = await moderateStory("chai", providerReturning('{"decision":"maybe","category":"sad","caption":"x"}'));
    expect(r).toMatchObject({ ok: false, error: "invalid_schema" });
  });
});

describe("moderateStory with the mock provider (no API key needed)", () => {
  it("approves a clean chai story", async () => {
    const r = await moderateStory("Cutting chai with papa after school, such a nice memory", mockProvider);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.decision).toBe("approved");
  });

  it("rejects spam", async () => {
    const r = await moderateStory("chai! click here https://spam.example", mockProvider);
    expect(r.ok && r.data.decision).toBe("rejected");
  });

  it("rejects off-topic stories", async () => {
    const r = await moderateStory("I went to the gym and lifted weights today", mockProvider);
    expect(r.ok && r.data.decision).toBe("rejected");
  });

  it.each([
    ["[mock:timeout]", "timeout"],
    ["[mock:ratelimit]", "rate_limited"],
    ["[mock:garbage]", "invalid_json"],
    ["[mock:badvalues]", "invalid_schema"],
  ])("trigger %s becomes %s", async (trigger, error) => {
    const r = await moderateStory(`chai ${trigger}`, mockProvider);
    expect(r).toMatchObject({ ok: false, error });
  });
});
