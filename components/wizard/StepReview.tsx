"use client";

import { DISCLAIMERS } from "@/lib/config/disclaimer";

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

export function StepReview() {
  const { config: c, quote, setStepIndex } = useWizard();
  const cust = c.customer;

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
            "Edit ↗" links above to fix.
          </div>
        )}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Submit pipeline lands in chunk (e)"
          className="w-full px-5 py-3 bg-amber-500/40 text-zinc-900 font-semibold rounded-md cursor-not-allowed"
        >
          Submit for engineering review
        </button>
        <p className="text-xs text-zinc-500 text-center">
          Submit is wired up in chunk (e) — DB persist + n8n webhook routes the
          submittal package to the PE.
        </p>
      </div>
    </div>
  );
}
