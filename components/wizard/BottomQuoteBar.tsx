"use client";

/**
 * Compact ballpark-quote bar that sits sticky at the bottom of the
 * wizard. Click to expand into the full line-item breakdown without
 * leaving the current step.
 *
 * Replaces the right-rail LiveQuoteSidebar now that the visualization
 * panel occupies that real estate.
 */

import { useState } from "react";

import { useWizard } from "./WizardProvider";

const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export function BottomQuoteBar() {
  const { quote, config } = useWizard();
  const [expanded, setExpanded] = useState(false);
  const footprintSqFt = config.shell.widthFt * config.shell.lengthFt;

  return (
    <div className="sticky bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between gap-4 py-2.5 text-left"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold hidden sm:block shrink-0">
              Ballpark
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-100 font-mono tabular-nums shrink-0">
              {fmtUSD(quote.ballparkLow)}
              <span className="text-zinc-500 mx-1">–</span>
              {fmtUSD(quote.ballparkHigh)}
            </div>
            <div className="text-xs text-zinc-500 hidden md:block truncate">
              {footprintSqFt.toLocaleString()} sqft · {quote.region}
              {" · "}wind {quote.windSpeedMph} mph
            </div>
          </div>
          <div className="text-xs text-zinc-500 shrink-0">
            {expanded ? "▼ Hide" : "▶ Details"}
          </div>
        </button>

        {expanded && (
          <div className="pb-3 max-h-72 overflow-y-auto border-t border-zinc-800/60 pt-3">
            <ul className="space-y-1 text-sm grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              {quote.lineItems.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-3 text-zinc-300"
                >
                  <span className="truncate" title={item.label}>
                    {item.label}
                  </span>
                  <span className="font-mono tabular-nums text-zinc-100 shrink-0">
                    {fmtUSD(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-2 border-t border-zinc-800/60 text-xs text-zinc-500 flex flex-wrap gap-x-4 gap-y-1">
              <span>Subtotal {fmtUSD(quote.subtotal)}</span>
              <span>
                Region {quote.region} ×{quote.regionMultiplier.toFixed(2)}
              </span>
              <span>Adjusted {fmtUSD(quote.adjustedSubtotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
