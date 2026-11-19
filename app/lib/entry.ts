export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? "";
}