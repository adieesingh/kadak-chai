import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("ADMIN_SESSION_SECRET must be set (16+ chars)");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/** Constant-time string compare (hashes first so length differences don't leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false; // not configured => nobody can log in
  // In production, never accept the .env.example placeholder or a short password.
  if (process.env.NODE_ENV === "production" && (p === "change-me" || p.length < 12)) {
    console.error("[admin] ADMIN_PASSWORD is too weak for production (need 12+ chars, not 'change-me').");
    return false;
  }
  // evaluate both so timing doesn't reveal which one was wrong
  const okU = safeEqual(username, u);
  const okP = safeEqual(password, p);
  return okU && okP;
}

/** Token format: "<expiryMs>.<hmac>" */
export function createSessionToken(now = Date.now()): string {
  const exp = String(now + SESSION_TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined | null, now?: number): boolean {
  if (!token) return false;
  const currentTime = now ?? Date.now();
  const [exp, sig, extra] = token.split(".");
  if (!exp || !sig || extra !== undefined) return false;
  if (!/^\d+$/.test(exp)) return false;
  if (!safeEqual(sig, sign(exp))) return false;
  return Number(exp) > currentTime;
}
