"use client";

import { useState } from "react";

import { DISCLAIMERS } from "@/lib/config/disclaimer";
import {
  submitDesign,
  SubmitError,
  type SubmitResult,
} from "@/lib/services/submit";

import { useWizard } from "./WizardProvider";

const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

interface Row {
  label: string;
  value: string | number;
}
interface ReviewSection {
  title: string;
  stepIndex: number;
  rows: Row[];
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function StepReview() {
  const { config: c, quote, setStepIndex } = useWizard();
  const cust = c.customer;

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");

  // ── Build a flat list of summary sections ───────────────────────────
  const sections: ReviewSection[] = [
    {
      title: "Shell",
      stepIndex: 0,
      rows: [
        {
          label: "Dimensions",
          value: `${c.shell.widthFt} × ${c.shell.lengthFt} × ${c.shell.eaveHeightFt} ft (eave)`,
        },
        {
          label: "Peak height",
          value: `${c.shell.peakHeightFt.toFixed(1)} ft`,
        },
        {
          label: "Bays",
          value: `${c.shell.numberOfBays} bays @ ${c.shell.baySpacingFt} ft`,
        },
        { label: "Stories", value: c.shell.stories },
        { label: "Clear-span trusses", value: c.shell.clearSpan ? "Yes" : "No" },
      ],
    },
    {
      title: "Roof",
      stepIndex: 1,
      rows: [
        { label: "Profile", value: c.roof.profile },
        { label: "Pitch", value: c.roof.pitch },
        { label: "Material", value: c.roof.material },
        {
          label: "Overhangs",
          value: `eave ${c.roof.eaveOverhangIn}" · gable ${c.roof.gableOverhangIn}"`,
        },
      ],
    },
    {
      title: "Foundation",
      stepIndex: 2,
      rows: [
        { label: "Type", value: c.foundation.type },
        ...(c.foundation.type === "slab"
          ? [
              {
                label: "Slab",
                value: `${c.foundation.slabThicknessIn}" · ${c.foundation.concretePsi} PSI`,
              },
              {
                label: "Thickened-edge",
                value: c.foundation.thickenedEdges ? "Yes" : "No",
              },
            ]
          : []),
      ],
    },
    {
      title: "Openings",
      stepIndex: 3,
      rows: [
        {
          label: "Overhead doors",
          value: c.openings.overheadDoors.length,
        },
        { label: "Entry doors", value: c.openings.entryDoors.length },
        { label: "Windows", value: c.openings.windows.length },
      ],
    },
    {
      title: "Additions",
      stepIndex: 4,
      rows: [
        {
          label: "Porches / lean-tos / carports",
          value: c.additions.porches.length,
        },
        {
          label: "Mezzanine",
          value: c.additions.mezzanine.enabled
            ? `${c.additions.mezzanine.areaSqFt.toLocaleString()} sqft`
            : "None",
        },
      ],
    },
    {
      title: "Interior",
      stepIndex: 5,
      rows: [
        {
          label: "Heated area",
          value:
            c.interior.heatedSqFt > 0
              ? `${c.interior.heatedSqFt.toLocaleString()} sqft`
              : "Shell only (no interior finish)",
        },
        ...(c.interior.heatedSqFt > 0
          ? [
              {
                label: "Bed / Bath",
                value: `${c.interior.bedrooms} BR / ${c.interior.bathrooms} BA`,
              },
              {
                label: "Open-concept",
                value: c.interior.openConceptGreatRoom ? "Yes" : "No",
              },
              {
                label: "Vaulted ceiling",
                value: c.interior.vaultedCeiling ? "Yes" : "No",
              },
            ]
          : []),
      ],
    },
    {
      title: "Exterior finish",
      stepIndex: 6,
      rows: [
        { label: "Siding", value: c.exteriorFinish.sidingType },
        { label: "Siding color", value: c.exteriorFinish.sidingColor },
        { label: "Trim color", value: c.exteriorFinish.trimColor },
        {
          label: "Cedar accents",
          value: c.exteriorFinish.cedarAccents
            ? (c.exteriorFinish.cedarAccentLocations ?? []).join(", ") || "Yes"
            : "No",
        },
        { label: "Insulation", value: c.exteriorFinish.insulation },
      ],
    },
    {
      title: "Site",
      stepIndex: 7,
      rows: [
        {
          label: "Address",
          value:
            [c.site.siteAddress, c.site.city, c.site.state, c.site.zip]
              .filter(Boolean)
              .join(", ") || "(not provided)",
        },
        { label: "County", value: c.site.county || "(not selected)" },
        {
          label: "Design wind",
          value: `${c.site.designWindSpeedMph} mph`,
        },
        {
          label: "Exposure / Risk / Enclosure",
          value: `${c.site.exposureCategory} · ${c.site.riskCategory} · ${c.site.enclosureClassification}`,
        },
      ],
    },
    {
      title: "Customer",
      stepIndex: 7,
      rows: [
        { label: "Name", value: cust.name || "(not provided)" },
        { label: "Email", value: cust.email ?? "(none)" },
        { label: "Phone", value: cust.phone ?? "(none)" },
      ],
    },
  ];

  // ── Submit-readiness validation ─────────────────────────────────────
  const missing: string[] = [];
  if (!cust.name.trim()) missing.push("Customer name");
  if (!c.site.state) missing.push("State");
  if (!c.site.county) missing.push("County");
  if (!c.site.city.trim()) missing.push("City");
  const isReady = missing.length === 0;

  // ── Submit handler ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isReady || status === "submitting") return;
    setStatus("submitting");
    setError(null);
    try {
      const res = await submitDesign({
        config: c,
        quote,
        customer: cust,
        submittedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });
      setResult(res);
      setStatus("success");
    } catch (e) {
      const message =
        e instanceof SubmitError
          ? `${e.message} (status ${e.status})`
          : e instanceof Error
            ? e.message
            : "Unknown error";
      setError(message);
      setStatus("error");
    }
  };

  // ── Success view replaces the page after submit ─────────────────────
  if (status === "success" && result) {
    return (
      <SuccessPanel
        result={result}
        customer={cust}
        ballparkLow={quote.ballparkLow}
        ballparkHigh={quote.ballparkHigh}
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Review every section before submitting. The PE seals plans against
        exactly this configuration — fix anything wrong here before sending.
      </p>

      {/* Ballpark hero */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-5 py-4">
        <div className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
          Ballpark range — for engineering submission
        </div>
        <div className="mt-1 text-3xl font-bold text-zinc-100 font-mono tabular-nums">
          {fmtUSD(quote.ballparkLow)}{" "}
          <span className="text-zinc-500">–</span>{" "}
          {fmtUSD(quote.ballparkHigh)}
        </div>
        <div className="mt-1 text-xs text-zinc-400">
          {c.shell.widthFt}×{c.shell.lengthFt}×{c.shell.eaveHeightFt}
          {" · "}
          {(c.shell.widthFt * c.shell.lengthFt).toLocaleString()} sqft
          {" · "}
          Region {quote.region}
          {" · "}
          {quote.windSpeedMph} mph design wind
        </div>
      </div>

      {/* Sections summary */}
      {sections.map((section) => (
        <section key={section.title}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-zinc-100">
              {section.title}
            </h3>
            <button
              type="button"
              onClick={() => setStepIndex(section.stepIndex)}
              className="text-xs text-amber-500 hover:text-amber-300 font-medium"
            >
              Edit ↗
            </button>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800">
            {section.rows.map((row, i) => (
              <div
                key={i}
                className="flex justify-between gap-3 px-4 py-2"
              >
                <span className="text-sm text-zinc-400">{row.label}</span>
                <span className="text-sm text-zinc-100 font-mono tabular-nums text-right">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Quote line items */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-zinc-100">
            Quote breakdown
          </h3>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800">
          {quote.lineItems.map((item, i) => (
            <div key={i} className="flex justify-between gap-3 px-4 py-2">
              <span className="text-sm text-zinc-300">{item.label}</span>
              <span className="text-sm text-zinc-100 font-mono tabular-nums">
                {fmtUSD(item.amount)}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-3 px-4 py-2 text-xs text-zinc-500">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">
              {fmtUSD(quote.subtotal)}
            </span>
          </div>
          <div className="flex justify-between gap-3 px-4 py-2 text-xs text-zinc-500">
            <span>Region ({quote.region}) ×</span>
            <span className="font-mono tabular-nums">
              {quote.regionMultiplier.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between gap-3 px-4 py-2 bg-amber-500/5">
            <span className="text-sm font-semibold text-amber-200">
              Ballpark range
            </span>
            <span className="text-sm font-bold text-amber-100 font-mono tabular-nums">
              {fmtUSD(quote.ballparkLow)} – {fmtUSD(quote.ballparkHigh)}
            </span>
          </div>
        </div>
      </section>

      {/* Optional customer notes */}
      <section>
        <label className="block">
          <div className="text-sm font-medium text-zinc-300 mb-1.5">
            Notes for the PE / sales team (optional)
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Any context that doesn't fit in the form — site quirks, timeline, special requests"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            disabled={status === "submitting"}
          />
          <p className="mt-1 text-xs text-zinc-500">
            {notes.length}/300 — appended to the Discord summary verbatim.
          </p>
        </label>
      </section>

      {/* Disclaimers */}
      <div className="space-y-3">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80 leading-relaxed">
          <strong className="text-amber-300">Engineering review:</strong>{" "}
          {DISCLAIMERS.ENGINEERING}
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Erection:</strong>{" "}
          {DISCLAIMERS.ERECTION}
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Quote:</strong>{" "}
          {DISCLAIMERS.QUOTE}
        </div>
      </div>

      {/* Submit zone */}
      <div className="border-t border-zinc-800 pt-5 space-y-3">
        {!isReady && (
          <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            <strong>Not ready to submit.</strong> Missing required fields:{" "}
            <span className="font-mono">{missing.join(", ")}</span>. Use the
            &quot;Edit ↗&quot; links above to fix.
          </div>
        )}
        {status === "error" && error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <strong>Submit failed.</strong>{" "}
            <span className="font-mono text-xs">{error}</span>
            <div className="mt-1 text-xs text-red-300/80">
              Click the button again to retry. If it keeps failing, contact
              GNP and reference your quote configuration.
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isReady || status === "submitting"}
          className={[
            "w-full px-5 py-3 font-semibold rounded-md transition-colors",
            !isReady || status === "submitting"
              ? "bg-amber-500/40 text-zinc-900 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow shadow-amber-500/20",
          ].join(" ")}
        >
          {status === "submitting" ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Submitting…
            </span>
          ) : (
            "Submit for engineering review"
          )}
        </button>
        <p className="text-xs text-zinc-500 text-center">
          Submission lands in the GNP team queue. A licensed PE will review and
          contact you within 5–10 business days.
        </p>
      </div>
    </div>
  );
}

// ── Success panel ────────────────────────────────────────────────────────

function SuccessPanel({
  result,
  customer,
  ballparkLow,
  ballparkHigh,
}: {
  result: SubmitResult;
  customer: { name: string; email?: string };
  ballparkLow: number;
  ballparkHigh: number;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-6 py-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-zinc-950 text-2xl font-bold mb-4">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-zinc-100">
          Submitted for engineering review
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Thanks, {customer.name}. Your design package is in the GNP queue.
        </p>

        <div className="mt-6 inline-block bg-zinc-950/60 border border-zinc-800 rounded-md px-4 py-2">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            Reference
          </div>
          <div className="text-lg font-mono text-amber-300 mt-0.5">
            {result.submissionId}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300 space-y-2">
        <p>
          A licensed Professional Engineer will review the configuration
          against the site-specific wind exposure and risk category, may
          request clarifications, and will produce a sealed plan set if the
          design is approvable as drawn.
        </p>
        <p>
          You&apos;ll receive an updated quote with final pricing once
          engineering is complete.{" "}
          <span className="text-zinc-400">
            Typical turnaround is 5–10 business days.
          </span>
        </p>
        {customer.email && (
          <p className="text-xs text-zinc-500 pt-1">
            Confirmations will be sent to{" "}
            <span className="font-mono text-zinc-300">{customer.email}</span>.
          </p>
        )}
      </div>

      <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80 leading-relaxed">
        <strong className="text-amber-300">Ballpark range:</strong>{" "}
        ${ballparkLow.toLocaleString()} – ${ballparkHigh.toLocaleString()} — final pricing confirmed after engineering review and material takeoff. This range is not a contract price.
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/design-portal/"
          className="inline-flex items-center justify-center px-5 py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 rounded-md text-sm transition-colors"
        >
          Design another building
        </a>
        <a
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 rounded-md text-sm transition-colors"
        >
          Back to GNP main site
        </a>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
