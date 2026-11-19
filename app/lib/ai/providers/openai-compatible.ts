import type { AiProvider } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";

export function createOpenAiCompatibleProvider(cfg: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): AiProvider {
  const url = cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions";

  return {
    name: "openai-compatible",
    async complete({ story, signal }) {
      const res = await fetch(url, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.4,
          max_tokens: 300,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(story) },
          ],
        }),
      });

      if (!res.ok) {
        throw Object.assign(new Error(`provider HTTP ${res.status}`), { status: res.status });
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return json.choices?.[0]?.message?.content ?? "";
    },
  };
}
