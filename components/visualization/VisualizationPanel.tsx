"use client";

/**
 * The always-visible visualization pane that lives on the left of the
 * wizard. Has a tab toggle for 3D view (Phase 2.1) and 2D floor plan
 * editor (Phase 2.3, currently a "Coming next" stub).
 *
 * The 3D canvas is loaded dynamically with ssr: false because three.js
 * needs a real DOM + WebGL context — static-exported HTML can't render it
 * server-side.
 */

import dynamic from "next/dynamic";
import { useState } from "react";

import { useWizard } from "@/components/wizard/WizardProvider";

const VisualizationCanvas = dynamic(
  () => import("./VisualizationCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
        Loading 3D viewport…
      </div>
    ),
  },
);

type ViewMode = "3d" | "2d";

export function VisualizationPanel() {
  const { config } = useWizard();
  const [view, setView] = useState<ViewMode>("3d");

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full min-h-[400px]">
      {/* Tab header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
        <div className="flex gap-1">
          <TabButton
            label="3D View"
            active={view === "3d"}
            onClick={() => setView("3d")}
          />
          <TabButton
            label="2D Floor Plan"
            active={view === "2d"}
            onClick={() => setView("2d")}
            badge="next"
          />
        </div>
        <div className="text-[10px] text-zinc-500 hidden sm:block font-mono">
          {config.shell.widthFt}×{config.shell.lengthFt}×
          {config.shell.eaveHeightFt}
        </div>
      </div>

      {/* Canvas area — fills remaining height */}
      <div className="flex-1 relative min-h-[350px]">
        {view === "3d" ? (
          <VisualizationCanvas config={config} />
        ) : (
          <FloorPlanComingSoon />
        )}
      </div>

      {/* Footer tip */}
      <div className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-950/60 text-[10px] text-zinc-500 shrink-0">
        {view === "3d" ? (
          <>
            <span className="text-zinc-400">Drag</span> rotate ·{" "}
            <span className="text-zinc-400">scroll</span> zoom ·{" "}
            <span className="text-zinc-400">right-click drag</span> pan
          </>
        ) : (
          <>Phase 2.3 — click to add rooms, drag walls to resize</>
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
        active
          ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
      ].join(" ")}
    >
      {label}
      {badge && (
        <span className="text-[9px] uppercase tracking-wider text-amber-500/80 bg-amber-500/10 px-1 py-0.5 rounded">
          {badge}
        </span>
      )}
    </button>
  );
}

function FloorPlanComingSoon() {
  return (
    <div className="w-full h-full flex items-center justify-center text-center px-6 bg-zinc-950/40">
      <div>
        <div className="text-xs uppercase tracking-wider text-amber-500/80 font-semibold mb-2">
          Coming next
        </div>
        <p className="text-base text-zinc-300 font-medium">
          2D floor plan editor
        </p>
        <p className="mt-2 text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
          Click to add rooms (bedroom, bathroom, kitchen). Drag wall corners
          and edges to resize. Solid lines for walls, dashed lines for
          doorways and archways. Lands in Phase 2.3.
        </p>
      </div>
    </div>
  );
}
