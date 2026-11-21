import { describe, expect, it } from "vitest";
import { extractJson, parseAiResponse } from "@/app/lib/ai/parse";

const valid = {
  decision: "approved",
  reason: null,
  category: "wholesome",
  caption: "Ek pyaali chai, bahut saara sukoon.",
};

describe("parseAiResponse: valid input", () => {
  it("accepts a clean approved response", () => {
    const r = parseAiResponse(JSON.stringify(valid));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.decision).toBe("approved");
      expect(r.data.category).toBe("wholesome");
      expect(r.data.caption).toBe(valid.caption);
    }
  });

  it("accepts a rejected response that has a reason", () => {
    const r = parseAiResponse(
      JSON.stringify({ decision: "rejected", reason: "Looks like spam", category: "other", caption: "" })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.reason).toBe("Looks like spam");
  });

  it("accepts JSON wrapped in markdown fences and extra text", () => {
    const wrapped = "Sure! Here you go:\n```json\n" + JSON.stringify(valid) + "\n```\nHope that helps.";
    const r = parseAiResponse(wrapped);
    expect(r.ok).toBe(true);
  });

  it("drops the caption of a rejected entry and the reason of an approved one", () => {
    const a = parseAiResponse(JSON.stringify({ ...valid, reason: "should be ignored" }));
    const b = parseAiResponse(
      JSON.stringify({ decision: "rejected", reason: "off-topic", category: "other", caption: "leftover" })
    );
    expect(a.ok && a.data.reason).toBe(null);
    expect(b.ok && b.data.caption).toBe("");
  });
});

describe("parseAiResponse: broken responses", () => {
  it("rejects plain text with no JSON", () => {
    const r = parseAiResponse("Sorry, I cannot help with that.");
    expect(r).toMatchObject({ ok: false, error: "invalid_json" });
  });

  it("rejects truncated JSON", () => {
    const r = parseAiResponse('{"decision":"approved","category":"funny","caption":"Chai gar');
    expect(r).toMatchObject({ ok: false, error: "invalid_json" });
  });

  it("rejects malformed JSON (trailing comma)", () => {
    const r = parseAiResponse('{"decision":"approved","category":"funny","caption":"Hi",}');
    expect(r).toMatchObject({ ok: false, error: "invalid_json" });
  });

  const emptyInputs: [unknown, string][] = [
    ["", "empty string"],
    ["   \n ", "whitespace only"],
    [undefined, "undefined"],
    [null, "null"],
    [42, "a number"],
  ];
  it.each(emptyInputs)("rejects %j (%s) as empty_response", (input) => {
    expect(parseAiResponse(input)).toMatchObject({ ok: false, error: "empty_response" });
  });
});

describe("parseAiResponse: valid JSON but wrong values", () => {
  it("rejects an unknown category", () => {
    const r = parseAiResponse(JSON.stringify({ ...valid, category: "sad" }));
    expect(r).toMatchObject({ ok: false, error: "invalid_schema" });
  });

  it("rejects an unknown decision", () => {
    const r = parseAiResponse(JSON.stringify({ ...valid, decision: "maybe" }));
    expect(r).toMatchObject({ ok: false, error: "invalid_schema" });
  });

  it("rejects a caption longer than 12 words", () => {
    const caption = "one two three four five six seven eight nine ten eleven twelve thirteen";
    const r = parseAiResponse(JSON.stringify({ ...valid, caption }));
    expect(r).toMatchObject({ ok: false, error: "invalid_schema" });
  });

  it("accepts a caption of exactly 12 words", () => {
    const caption = "one two three four five six seven eight nine ten eleven twelve";
    expect(parseAiResponse(JSON.stringify({ ...valid, caption })).ok).toBe(true);
  });

  it("rejects an approved entry with an empty caption", () => {
    const r = parseAiResponse(JSON.stringify({ ...valid, caption: "" }));
    expect(r).toMatchObject({ ok: false, error: "invalid_schema" });
  });

  it("rejects a rejected entry with no reason", () => {
    const r = parseAiResponse(JSON.stringify({ decision: "rejected", category: "other", caption: "" }));
    expect(r).toMatchObject({ ok: false, error: "invalid_schema" });
  });

  it("rejects missing fields", () => {
    expect(parseAiResponse("{}")).toMatchObject({ ok: false, error: "invalid_schema" });
  });

  it("rejects wrong types (caption as a number)", () => {
    const r = parseAiResponse(JSON.stringify({ ...valid, caption: 123 }));
    expect(r).toMatchObject({ ok: false, error: "invalid_schema" });
  });
});

describe("extractJson", () => {
  it("returns the first top-level object and ignores braces inside strings", () => {
    const text = 'noise {"a":"has } brace","b":{"c":1}} trailing';
    expect(extractJson(text)).toBe('{"a":"has } brace","b":{"c":1}}');
  });

  it("returns null when there is no object", () => {
    expect(extractJson("no json here")).toBeNull();
  });
});
