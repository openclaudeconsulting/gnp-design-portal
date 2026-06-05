"use client";

import {
  AddButton,
  CheckboxInput,
  NumberInput,
  RemovableCard,
  ToggleGroup,
} from "@/components/ui/inputs";
import type {
  Porch,
  PorchType,
  PostStyle,
  Wall,
} from "@/lib/types/building-config";
import { useWizard } from "./WizardProvider";

const WALLS: { value: Wall; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

const PORCH_TYPES: { value: PorchType; label: string; desc?: string }[] = [
  {
    value: "covered-porch",
    label: "Covered porch",
    desc: "Roof + posts (residential)",
  },
  {
    value: "lean-to",
    label: "Lean-to",
    desc: "Single-slope extension",
  },
  {
    value: "carport",
    label: "Carport",
    desc: "Open vehicle cover",
  },
];

const POST_STYLES: { value: PostStyle; label: string; desc?: string }[] = [
  {
    value: "wood-square",
    label: "Wood square",
    desc: "Standard 6×6 PT",
  },
  {
    value: "cedar",
    label: "Cedar",
    desc: "Stained cedar wrap",
  },
  {
    value: "timber-on-stone-base",
    label: "Timber on stone base",
    desc: "Premium look (+$850/post)",
  },
  {
    value: "metal",
    label: "Metal",
    desc: "Painted steel",
  },
];

const DEFAULT_PORCH: Porch = {
  type: "covered-porch",
  widthFt: 16,
  depthFt: 8,
  wall: "front",
  postStyle: "wood-square",
};

export function StepAdditions() {
  const { config, patchAdditions } = useWizard();
  const a = config.additions;
  const footprintSqFt = config.shell.widthFt * config.shell.lengthFt;

  const updatePorch = (i: number, patch: Partial<Porch>) =>
    patchAdditions({
      porches: a.porches.map((p, idx) =>
        idx === i ? { ...p, ...patch } : p,
      ),
    });
  const addPorch = () =>
    patchAdditions({ porches: [...a.porches, { ...DEFAULT_PORCH }] });
  const removePorch = (i: number) =>
    patchAdditions({ porches: a.porches.filter((_, idx) => idx !== i) });

  const setMezzanine = (patch: Partial<typeof a.mezzanine>) =>
    patchAdditions({ mezzanine: { ...a.mezzanine, ...patch } });

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-400">
        Porches, lean-tos, carports, and an optional mezzanine (interior loft).
      </p>

      {/* PORCHES / LEAN-TOS / CARPORTS */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">
          Porches / lean-tos / carports
        </h3>
        {a.porches.length === 0 && (
          <p className="text-sm text-zinc-500 italic">No additions yet.</p>
        )}
        {a.porches.map((p, i) => (
          <RemovableCard
            key={i}
            title={`Addition ${i + 1}`}
            onRemove={() => removePorch(i)}
          >
            <ToggleGroup
              label="Type"
              value={p.type}
              onChange={(v) => updatePorch(i, { type: v as PorchType })}
              options={PORCH_TYPES}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <NumberInput
                label="Width"
                unit="ft"
                min={4}
                value={p.widthFt}
                onChange={(v) => updatePorch(i, { widthFt: v })}
              />
              <NumberInput
                label="Depth"
                unit="ft"
                min={4}
                value={p.depthFt}
                onChange={(v) => updatePorch(i, { depthFt: v })}
              />
              <ToggleGroup
                label="Wall"
                columns={4}
                value={p.wall}
                onChange={(v) => updatePorch(i, { wall: v as Wall })}
                options={WALLS}
              />
            </div>
            <div className="mt-3">
              <ToggleGroup
                label="Post style"
                value={p.postStyle}
                onChange={(v) =>
                  updatePorch(i, { postStyle: v as PostStyle })
                }
                options={POST_STYLES}
              />
            </div>
          </RemovableCard>
        ))}
        <AddButton onClick={addPorch} label="Add porch / lean-to / carport" />
      </section>

      {/* MEZZANINE */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">Mezzanine</h3>
        <CheckboxInput
          label="Include a mezzanine (interior loft)"
          checked={a.mezzanine.enabled}
          onChange={(enabled) =>
            setMezzanine({
              enabled,
              areaSqFt: enabled
                ? Math.max(100, a.mezzanine.areaSqFt)
                : 0,
            })
          }
          hint="An elevated interior floor — typically used as an office, game room, or open-rail loft."
        />
        {a.mezzanine.enabled && (
          <div className="ml-7">
            <NumberInput
              label="Mezzanine area"
              unit="sqft"
              min={100}
              max={footprintSqFt}
              value={a.mezzanine.areaSqFt}
              onChange={(v) => setMezzanine({ areaSqFt: v })}
              hint={`Capped at the building footprint (${footprintSqFt.toLocaleString()} sqft)`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
