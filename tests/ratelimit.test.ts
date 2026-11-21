import { describe, expect, it } from "vitest";
import { entryLimiter, loginLimiter } from "@/app/lib/ratelimit";

// These tests use the in-memory limiters (no UPSTASH_* env vars in the test run).
describe("in-memory rate limiters", () => {
  it("blocks the 6th entry from one IP within the window", async () => {
    const ip = "203.0.113.10";
    for (let i = 0; i < 5; i++) expect((await entryLimiter.limit(ip)).success).toBe(true);
    expect((await entryLimiter.limit(ip)).success).toBe(false);
  });

  it("does not share one counter between the entry and login limiters", async () => {
    const ip = "203.0.113.20";
    for (let i = 0; i < 5; i++) await entryLimiter.limit(ip); // use up the entry quota
    expect((await loginLimiter.limit(ip)).success).toBe(true); // login must still work
  });

  it("keeps different IPs separate", async () => {
    for (let i = 0; i < 6; i++) await entryLimiter.limit("203.0.113.30");
    expect((await entryLimiter.limit("203.0.113.31")).success).toBe(true);
  });
});
