"use client";

/**
 * The always-visible visualization pane that lives on the left of the
 * wizard. Has a tab toggle for 3D view (procedural three.js) and 2D
 * floor plan editor (interactive react-konva canvas).
 *
 * Both canvases are loaded via next/dynamic with ssr:false because
 * three.js and konva both need a real DOM — static-exported HTML can't
 * render them server-side.
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

const FloorPlanEditor = dynamic(() => import("./FloorPlanEditor"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
      Loading 2D floor plan editor…
    </div>
  ),
});

type ViewMode = "3d" | "2d";

export function VisualizationPanel() {
  const { config } = useWizard();
  const [view, setView] = useState<ViewMode>("3d");
  const roomCount = config.floorPlan.rooms.length;

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
            badge={roomCount > 0 ? `${roomCount}` : undefined}
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
          <FloorPlanEditor />
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
          <>
            <span className="text-zinc-400">Click</span> a room type, then{" "}
            <span className="text-zinc-400">click inside the building</span> to
            place it · drag rooms to move · drag handles to resize ·{" "}
            <span className="text-zinc-400">Delete</span> key to remove
          </>
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
        <span
          className={[
            "text-[9px] font-mono px-1.5 py-0.5 rounded",
            active
              ? "bg-amber-500/30 text-amber-100"
              : "bg-zinc-800 text-zinc-400",
          ].join(" ")}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
