import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Use at the top of every admin API route and the admin page. */
export async function isAdmin(): Promise<boolean> {
  try {
    const jar = await cookies(); // Next 15. In Next 14 use: cookies().get(...)
    return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  } catch {
    return false; // missing secret etc. => treat as logged out
  }
}
