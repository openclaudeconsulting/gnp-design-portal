"use client";

import { BRAND } from "@/lib/config/brand";
import { LiveQuoteSidebar } from "./LiveQuoteSidebar";
import { useWizard } from "./WizardProvider";
import { WizardStepRouter } from "./WizardStepRouter";

export function WizardLayout() {
  const { steps, stepIndex, setStepIndex, nextStep, prevStep } = useWizard();
  const current = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
              {BRAND.name}
              <span className="ml-2 text-sm font-normal text-amber-500">
                Design Portal
              </span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">{BRAND.serviceArea}</p>
          </div>
          <div className="text-right text-xs text-zinc-500 hidden sm:block">
            <div>{BRAND.phone}</div>
            <div>{BRAND.email}</div>
          </div>
        </div>
      </header>

      {/* ── Step indicator ────────────────────────────────────── */}
      <nav className="border-b border-zinc-800 bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-1 overflow-x-auto">
            {steps.map((s, i) => {
              const completed = i < stepIndex;
              const active = i === stepIndex;
              return (
                <li key={s.id} className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setStepIndex(i)}
                    className={[
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                      active
                        ? "bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/40"
                        : completed
                          ? "text-amber-500/80 hover:bg-zinc-800"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono",
                        active
                          ? "bg-amber-500 text-zinc-950"
                          : completed
                            ? "bg-amber-500/40 text-amber-100"
                            : "bg-zinc-800 text-zinc-500",
                      ].join(" ")}
                    >
                      {completed ? "✓" : i + 1}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <span className="text-zinc-700 mx-0.5">·</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* ── Main + sidebar ────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
        <main>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 sm:p-8">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-wider text-amber-500 font-semibold">
                Step {stepIndex + 1} of {steps.length}
              </div>
              <h2 className="mt-1 text-2xl font-bold text-zinc-100">
                {current.label}
              </h2>
            </div>
            <WizardStepRouter />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={isFirst}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={isLast}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-md shadow shadow-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </main>

        <aside>
          <LiveQuoteSidebar />
        </aside>
      </div>

      {/* ── Footer disclaimer ─────────────────────────────────── */}
      <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p>
            Designs submitted via this portal are{" "}
            <strong className="text-zinc-300">
              submitted for engineering review
            </strong>
            . Final plans are sealed by a licensed Professional Engineer for the
            specific site.
          </p>
        </div>
      </footer>
    </div>
  );
}
