import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("Security Headers Configuration", () => {
  it("defines required security headers on all routes", async () => {
    expect(nextConfig.headers).toBeDefined();
    if (!nextConfig.headers) return;

    const headersList = await nextConfig.headers();
    expect(headersList.length).toBeGreaterThan(0);

    const globalHeaders = headersList.find((h) => h.source === "/(.*)");
    expect(globalHeaders).toBeDefined();

    const headerMap = new Map(globalHeaders!.headers.map((h) => [h.key, h.value]));

    expect(headerMap.get("X-Frame-Options")).toBe("DENY");
    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerMap.get("Strict-Transport-Security")).toContain("max-age=");
    expect(headerMap.get("Permissions-Policy")).toBeDefined();
  });
});
