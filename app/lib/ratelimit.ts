import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface Limiter {
  limit: (identifier: string) => Promise<RateLimitResult>;
}

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let loginLimiter: Limiter;
let entryLimiter: Limiter;

if (hasUpstash) {
  const redis = Redis.fromEnv();

  const upstashLogin = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:login",
    analytics: true,
  });

  const upstashEntry = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "rl:entry",
    analytics: true,
  });

  loginLimiter = {
    async limit(id: string) {
      const res = await upstashLogin.limit(id);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    },
  };

  entryLimiter = {
    async limit(id: string) {
      const res = await upstashEntry.limit(id);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    },
  };
} else {
  // Upstash Redis configure na hone par in-memory local fallback chalao (dev testing ke liye)
  const memoryStore = new Map<string, { count: number; reset: number }>();

  function createMemoryLimiter(max: number, windowMs: number): Limiter {
    return {
      async limit(identifier: string) {
        const now = Date.now();
        const record = memoryStore.get(identifier);

        if (!record || now > record.reset) {
          memoryStore.set(identifier, { count: 1, reset: now + windowMs });
          return {
            success: true,
            limit: max,
            remaining: max - 1,
            reset: now + windowMs,
          };
        }

        if (record.count >= max) {
          return {
            success: false,
            limit: max,
            remaining: 0,
            reset: record.reset,
          };
        }

        record.count += 1;
        return {
          success: true,
          limit: max,
          remaining: max - record.count,
          reset: record.reset,
        };
      },
    };
  }

  loginLimiter = createMemoryLimiter(5, 10 * 60 * 1000);
  entryLimiter = createMemoryLimiter(5, 60 * 60 * 1000);
}

export { loginLimiter, entryLimiter, hasUpstash };

// Request headers se client ki real IP address nikaalo
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

// User privacy ke liye IP address ka irreversible SHA-256 hash banao
export function hashIp(ip: string): string {
  const salt = process.env.ADMIN_SESSION_SECRET ?? "kadak-default-salt";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 32);
}
