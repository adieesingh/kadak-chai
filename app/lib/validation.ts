import {z} from "zod";

const counterChars = (s: string) => [...s].length;

export const entryInputSchema  =z.object({
    name:z.string().trim().min(2,"Name too short").max(60),
    city:z.string().trim().min(2).max(60),
    contact:z.string().trim().min(5).max(100),
    story:z.string().trim().min(10,"Story too short").refine((s)=>counterChars(s)<=300,"Max 300 charter"),
    consent: z.literal(true, { error: "Consent required" })                            

})

export type EntryInput = z.infer<typeof entryInputSchema>;

export function normalizeContact(raw:string){
    const v = raw.trim();
     if (v.includes("@")) {
    const ok = z.string().email().safeParse(v).success;
    return ok ? { type: "email" as const, value: v.toLowerCase() } : null;
  }
  const digits = v.replace(/[\s\-()]/g, "");
  return /^\+?[0-9]{10,13}$/.test(digits)
    ? { type: "phone" as const, value: digits }
    : null;
}