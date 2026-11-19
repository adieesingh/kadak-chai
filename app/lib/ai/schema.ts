import { z } from "zod";

export const CATEGORIES = ["funny", "nostalgic", "wholesome", "other"] as const;
export const DECISIONS = ["approved", "rejected"] as const;

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * Shape the LLM MUST return. Anything else is treated as an AI failure
 * and the entry is saved as pending_review.
 */
export const aiResponseSchema = z
  .object({
    decision: z.enum(DECISIONS),
    reason: z.string().trim().max(300).nullable().optional(),
    category: z.enum(CATEGORIES),
    caption: z.string().trim().max(200),
  })
  .superRefine((val, ctx) => {
    if (val.decision === "approved") {
      if (val.caption.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["caption"],
          message: "caption required when approved",
        });
      } else if (countWords(val.caption) > 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["caption"],
          message: "caption must be 12 words or fewer",
        });
      }
    }
    if (val.decision === "rejected" && !val.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "reason required when rejected",
      });
    }
  });

export type AiResponse = z.infer<typeof aiResponseSchema>;

export type ModerationResult =
  | { ok: true; data: AiResponse; provider: string }
  | { ok: false; error: AiErrorCode; provider: string; raw?: string };

export type AiErrorCode =
  | "timeout"
  | "rate_limited"
  | "network_error"
  | "provider_error"
  | "empty_response"
  | "invalid_json"
  | "invalid_schema"
  | "config_error";
