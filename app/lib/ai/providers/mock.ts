import type { AiProvider } from "./types";

/**
 * Deterministic fake provider. Works with no API key.
 * Special trigger words let reviewers/tests exercise failure paths:
 *   "[mock:timeout]"  -> throws a timeout error
 *   "[mock:ratelimit]"-> throws a 429-style error
 *   "[mock:garbage]"  -> returns non-JSON text
 *   "[mock:badvalues]"-> returns valid JSON with invalid values
 */
const SPAM_WORDS = ["http://", "https://", "www.", "buy now", "click here", "free money", "casino"];
const ABUSE_WORDS = ["idiot", "stupid", "hate you", "kill"];
const CHAI_WORDS = ["chai", "tea", "cutting", "adrak", "kulhad", "chaiwala", "chai wala", "चाय"];

export const mockProvider: AiProvider = {
  name: "mock",
  async complete({ story }) {
    const s = story.toLowerCase();

    if (s.includes("[mock:timeout]")) {
      const e = new Error("mock timeout");
      e.name = "TimeoutError";
      throw e;
    }
    if (s.includes("[mock:ratelimit]")) {
      throw Object.assign(new Error("mock 429"), { status: 429 });
    }
    if (s.includes("[mock:garbage]")) return "Sorry, I cannot help with that.";
    if (s.includes("[mock:badvalues]")) {
      return JSON.stringify({ decision: "maybe", category: "sad", caption: "x" });
    }

    if (SPAM_WORDS.some((w) => s.includes(w))) {
      return JSON.stringify({ decision: "rejected", reason: "Looks like spam", category: "other", caption: "" });
    }
    if (ABUSE_WORDS.some((w) => s.includes(w))) {
      return JSON.stringify({ decision: "rejected", reason: "Abusive language", category: "other", caption: "" });
    }
    if (!CHAI_WORDS.some((w) => s.includes(w))) {
      return JSON.stringify({ decision: "rejected", reason: "Not about a chai break", category: "other", caption: "" });
    }

    let category: "funny" | "nostalgic" | "wholesome" | "other" = "wholesome";
    if (/(lol|haha|funny|jokes?|hasna|hans)/.test(s)) category = "funny";
    else if (/(childhood|bachpan|papa|dadi|nani|yaad|memories|school|college)/.test(s)) category = "nostalgic";

    const captions = {
      funny: "Chai garam, jokes aur bhi garam.",
      nostalgic: "Purani yaadein, nayi chai ki chuski.",
      wholesome: "Ek pyaali chai, bahut saara sukoon.",
      other: "Chai ka apna hi mazaa hai.",
    } as const;

    return JSON.stringify({ decision: "approved", reason: null, category, caption: captions[category] });
  },
};
