"use client";

import { DISCLAIMERS } from "@/lib/config/disclaimer";
import { useWizard } from "./WizardProvider";

const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export function LiveQuoteSidebar() {
  const { quote, config } = useWizard();
  const footprintSqFt = config.shell.widthFt * config.shell.lengthFt;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 lg:sticky lg:top-24">
      {/* Headline range */}
      <div className="text-xs uppercase tracking-wider text-amber-500 font-semibold">
        Ballpark Quote
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-100 font-mono tabular-nums">
        {fmtUSD(quote.ballparkLow)}
        <span className="text-zinc-500 mx-1">–</span>
        {fmtUSD(quote.ballparkHigh)}
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {config.shell.widthFt}×{config.shell.lengthFt}×
        {config.shell.eaveHeightFt}
        {" · "}
        {footprintSqFt.toLocaleString()} sqft
        {" · "}Region: {quote.region}
      </div>

      <hr className="my-4 border-zinc-800" />

      {/* Line items */}
      <ul className="space-y-1.5 text-sm">
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

      <hr className="my-4 border-zinc-800" />

      {/* Subtotal + region adjustment */}
      <div className="space-y-1 text-xs text-zinc-400">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums text-zinc-300">
            {fmtUSD(quote.subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Region ({quote.region}) ×</span>
          <span className="font-mono tabular-nums text-zinc-300">
            {quote.regionMultiplier.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-zinc-300">
          <span>Adjusted</span>
          <span className="font-mono tabular-nums">
            {fmtUSD(quote.adjustedSubtotal)}
          </span>
        </div>
        <div className="flex justify-between text-zinc-500 pt-1">
          <span>Design wind</span>
          <span className="font-mono tabular-nums">
            {quote.windSpeedMph} mph
          </span>
        </div>
      </div>

      <hr className="my-4 border-zinc-800" />

      <p className="text-[10px] leading-relaxed text-zinc-500">
        {DISCLAIMERS.QUOTE}
      </p>
    </div>
  );
}
