/**
 * Client-side submit service — POSTs the design submittal package to the
 * Cloudflare Pages Function at /api/design-portal-submit.
 *
 * In production both the portal and the function live on
 * gnp-steel-trusses.com, so the relative URL is same-origin. In
 * `npm run dev` the function isn't reachable — the Submit button renders
 * but the call 404s. Document this in the README rather than mocking
 * a local dev backend.
 */

import type { QuoteBreakdown } from "@/lib/services/quote-engine";
import type {
  BuildingConfig,
  CustomerContact,
} from "@/lib/types/building-config";

export interface SubmitPayload {
  config: BuildingConfig;
  quote: QuoteBreakdown;
  customer: CustomerContact;
  /** ISO-8601 timestamp captured at click time. */
  submittedAt: string;
  /** Free-text from the customer; optional. */
  notes?: string;
}

export interface SubmitResult {
  ok: true;
  submissionId: string;
  /** Echo of the matched region (useful for the confirmation copy). */
  region?: string;
}

export class SubmitError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Submit failed (${status}): ${body.slice(0, 200)}`);
    this.name = "SubmitError";
  }
}

/**
 * Submit the design package. Throws SubmitError on non-2xx response.
 */
export async function submitDesign(
  payload: SubmitPayload,
): Promise<SubmitResult> {
  const res = await fetch("/api/design-portal-submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new SubmitError(res.status, text);
  }
  try {
    return JSON.parse(text) as SubmitResult;
  } catch {
    throw new SubmitError(res.status, "Invalid JSON in success response");
  }
}
