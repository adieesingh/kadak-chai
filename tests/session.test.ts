import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  SESSION_TTL_MS,
  checkCredentials,
  createSessionToken,
  verifySessionToken,
} from "@/app/lib/admin/session";

const OLD_ENV = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-at-least-16-chars";
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "a-strong-password-123";
});
afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("session token", () => {
  it("accepts a freshly created token", () => {
    expect(verifySessionToken(createSessionToken())).toBe(true);
  });

  it("rejects an expired token", () => {
    const issuedAt = Date.now() - SESSION_TTL_MS - 1000;
    expect(verifySessionToken(createSessionToken(issuedAt))).toBe(false);
  });

  it("rejects a tampered expiry", () => {
    const [, sig] = createSessionToken().split(".");
    const farFuture = String(Date.now() + 10 * SESSION_TTL_MS);
    expect(verifySessionToken(`${farFuture}.${sig}`)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken();
    process.env.ADMIN_SESSION_SECRET = "a-completely-different-secret";
    expect(verifySessionToken(token)).toBe(false);
  });

  it.each([undefined, null, "", "abc", "123.", ".abc", "1.2.3", "abc.def"])("rejects malformed token %j", (t) => {
    expect(verifySessionToken(t as string | null | undefined)).toBe(false);
  });
});

describe("checkCredentials", () => {
  it("accepts the right username and password", () => {
    expect(checkCredentials("admin", "a-strong-password-123")).toBe(true);
  });

  it("rejects a wrong password or wrong username", () => {
    expect(checkCredentials("admin", "nope")).toBe(false);
    expect(checkCredentials("root", "a-strong-password-123")).toBe(false);
  });

  it("fails closed when credentials are not configured", () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    expect(checkCredentials("", "")).toBe(false);
    expect(checkCredentials("admin", "a-strong-password-123")).toBe(false);
  });

  it("in production, refuses the placeholder password from .env.example", () => {
    process.env = { ...process.env, NODE_ENV: "production", ADMIN_PASSWORD: "change-me" };
    expect(checkCredentials("admin", "change-me")).toBe(false);
  });

  it("in production, refuses a password shorter than 12 characters", () => {
    process.env = { ...process.env, NODE_ENV: "production", ADMIN_PASSWORD: "short-pw" };
    expect(checkCredentials("admin", "short-pw")).toBe(false);
  });
});
