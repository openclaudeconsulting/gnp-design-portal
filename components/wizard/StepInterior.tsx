"use client";

import { CheckboxInput, NumberInput } from "@/components/ui/inputs";
import { useWizard } from "./WizardProvider";

export function StepInterior() {
  const { config, patchInterior } = useWizard();
  const i = config.interior;
  const footprintSqFt = config.shell.widthFt * config.shell.lengthFt;
  const maxHeated = footprintSqFt * (config.shell.stories === 2 ? 2 : 1);

  const roomCount = config.floorPlan.rooms.length;
  const usingFloorPlan = roomCount > 0;

  return (
    <div className="space-y-6">
      {usingFloorPlan ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
          <strong className="text-amber-300">
            Reading from your floor plan ({roomCount} room
            {roomCount !== 1 ? "s" : ""}).
          </strong>{" "}
          The values below are computed from the rooms you've drawn on the
          2D Floor Plan tab — changing them here would be overwritten on
          the next floor-plan update. To adjust counts or area, edit the
          rooms in the 2D editor.
        </div>
      ) : (
        <p className="text-sm text-zinc-400">
          For residential-finished buildings, enter the heated/conditioned
          area and room counts here — OR tap{" "}
          <span className="text-zinc-200">2D Floor Plan</span> on the
          visualization panel to draw the rooms directly (heated sqft,
          bedrooms, and bathrooms will be derived automatically). Leave
          heated sqft at 0 for an ag/storage shell.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NumberInput
          label="Heated / conditioned area"
          unit="sqft"
          min={0}
          max={maxHeated}
          value={i.heatedSqFt}
          onChange={(v) => patchInterior({ heatedSqFt: v })}
          hint={
            usingFloorPlan
              ? "(derived from floor plan)"
              : `Footprint: ${footprintSqFt.toLocaleString()} sqft × ${config.shell.stories} story`
          }
        />
        <NumberInput
          label="Bedrooms"
          min={0}
          max={10}
          value={i.bedrooms}
          onChange={(v) => patchInterior({ bedrooms: v })}
          hint={usingFloorPlan ? "(derived from floor plan)" : undefined}
        />
        <NumberInput
          label="Bathrooms"
          min={0}
          max={10}
          step={0.5}
          value={i.bathrooms}
          onChange={(v) => patchInterior({ bathrooms: v })}
          hint={
            usingFloorPlan ? "(derived from floor plan)" : "0.5 = half bath"
          }
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Open-concept great room"
          checked={i.openConceptGreatRoom}
          onChange={(v) => patchInterior({ openConceptGreatRoom: v })}
          hint="Combines living/kitchen/dining into one open space — pairs naturally with clear-span trusses."
        />
        <CheckboxInput
          label="Vaulted ceiling"
          checked={i.vaultedCeiling}
          onChange={(v) => patchInterior({ vaultedCeiling: v })}
          hint="Open to the roof structure (exposed beams). Adds a premium per heated sqft."
        />
      </div>

      {i.heatedSqFt === 0 ? (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
          <strong className="text-amber-300">No interior finish.</strong> The
          quote will not include drywall, HVAC, plumbing, or electrical rough-in.
          This is appropriate for a workshop, barn, or storage building shell.
        </div>
      ) : (
        <div className="rounded-md border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-400">
          Interior finish includes drywall, flooring, HVAC, electrical, and
          plumbing rough-in at a per-sqft rate. Bathroom fixtures and vaulted-
          ceiling premiums add on top.
        </div>
      )}
    </div>
  );
}
