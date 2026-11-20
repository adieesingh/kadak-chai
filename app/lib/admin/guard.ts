import { connection } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

// Admin auth check: Har admin route aur page pe session verify karne ke liye
export async function isAdmin(): Promise<boolean> {
  await connection();
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value, Date.now());
}