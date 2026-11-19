import { aiResponseSchema, type AiResponse, type AiErrorCode } from "./schema";

export type ParseResult =
  | { ok: true; data: AiResponse }
  | { ok: false; error: Extract<AiErrorCode, "empty_response" | "invalid_json" | "invalid_schema">; detail?: string };

/**
 * Models often wrap JSON in ```json fences or add a sentence around it.
 * Pull out the first top-level {...} block.
 */
export function extractJson(text: string): string | null {
  const unfenced = text.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return unfenced.slice(start, i + 1);
    }
  }
  return null;
}

/** Never throws. Returns a result object. */
export function parseAiResponse(raw: unknown): ParseResult {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, error: "empty_response" };
  }

  const jsonText = extractJson(raw);
  if (!jsonText) return { ok: false, error: "invalid_json", detail: "no JSON object found" };

  let obj: unknown;
  try {
    obj = JSON.parse(jsonText);
  } catch (e) {
    return { ok: false, error: "invalid_json", detail: (e as Error).message };
  }

  const parsed = aiResponseSchema.safeParse(obj);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_schema",
      detail: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  // Normalise: rejected entries carry no caption, approved entries carry no reason.
  const d = parsed.data;
  return {
    ok: true,
    data: {
      decision: d.decision,
      category: d.category,
      reason: d.decision === "rejected" ? d.reason ?? null : null,
      caption: d.decision === "approved" ? d.caption : "",
    },
  };
}
