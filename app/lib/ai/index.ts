import { parseAiResponse } from "./parse";
import type { AiErrorCode, ModerationResult } from "./schema";
import type { AiProvider } from "./providers/types";
import { mockProvider } from "./providers/mock";
import { createOpenAiCompatibleProvider } from "./providers/openai-compatible";


const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 8000);

function getProvider(): AiProvider | { configError: string } {
  const kind = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  if (kind === "mock") return mockProvider;

  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  const apiKey = process.env.AI_API_KEY ?? "";
  if (!baseUrl || !model) {
    return { configError: "AI_BASE_URL and AI_MODEL are required when AI_PROVIDER is not 'mock'" };
  }
  return createOpenAiCompatibleProvider({ baseUrl, apiKey, model });
}

function mapError(e: unknown): AiErrorCode {
  const err = e as { name?: string; status?: number };
  if (err?.name === "AbortError" || err?.name === "TimeoutError") return "timeout";
  if (err?.status === 429) return "rate_limited";
  if (typeof err?.status === "number") return "provider_error";
  return "network_error";
}

// Yeh function kabhi throw nahi karta, hamesha safe result return karta hai (error aane pe pending_review)
export async function moderateStory(
  story: string,
  providerOverride?: AiProvider
): Promise<ModerationResult> {
  const p = providerOverride ?? getProvider();
  if ("configError" in p) {
    console.error("[ai]", p.configError);
    return { ok: false, error: "config_error", provider: "unconfigured" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let raw = "";
  try {
    raw = await p.complete({ story, signal: controller.signal });
  } catch (e) {
    return { ok: false, error: mapError(e), provider: p.name };
  } finally {
    clearTimeout(timer);
  }

  const parsed = parseAiResponse(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, provider: p.name, raw: raw.slice(0, 2000) };
  }
  return { ok: true, data: parsed.data, provider: p.name };
}
