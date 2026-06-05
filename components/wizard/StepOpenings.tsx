"use client";

import {
  AddButton,
  NumberInput,
  RemovableCard,
  ToggleGroup,
} from "@/components/ui/inputs";
import type {
  EntryDoor,
  EntryDoorType,
  OverheadDoor,
  OverheadDoorType,
  Wall,
  Window as Wnd,
  WindowType,
} from "@/lib/types/building-config";
import { useWizard } from "./WizardProvider";

const WALLS: { value: Wall; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

const OH_TYPES: { value: OverheadDoorType; label: string; desc?: string }[] = [
  { value: "overhead", label: "Overhead", desc: "Sectional roll-up" },
  { value: "rollup", label: "Roll-up", desc: "Coiling steel" },
  { value: "sliding", label: "Sliding", desc: "Barn-style slider" },
  { value: "bifold", label: "Bifold", desc: "Hangar / hydraulic" },
];

const ENTRY_TYPES: { value: EntryDoorType; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "french-double", label: "French double" },
];

const WINDOW_TYPES: { value: WindowType; label: string; desc?: string }[] = [
  { value: "fixed", label: "Fixed", desc: "Picture (non-operable)" },
  { value: "single-hung", label: "Single-hung" },
  { value: "double-hung", label: "Double-hung" },
  { value: "casement", label: "Casement" },
  {
    value: "two-story-wall",
    label: "Two-story wall",
    desc: "Signature open look",
  },
  { value: "gable-end", label: "Gable-end" },
];

const DEFAULT_OH: OverheadDoor = {
  widthFt: 10,
  heightFt: 10,
  type: "overhead",
  wall: "front",
  positionFt: 0,
};
const DEFAULT_ENTRY: EntryDoor = {
  widthFt: 3,
  heightFt: 7,
  type: "single",
  wall: "front",
  positionFt: 0,
};
const DEFAULT_WINDOW: Wnd = {
  widthFt: 3,
  heightFt: 4,
  type: "double-hung",
  wall: "front",
  positionFt: 0,
};

export function StepOpenings() {
  const { config, patchOpenings } = useWizard();
  const o = config.openings;

  // ── Overhead doors ────────────────────────────────────────────
  const updateOH = (i: number, patch: Partial<OverheadDoor>) =>
    patchOpenings({
      overheadDoors: o.overheadDoors.map((d, idx) =>
        idx === i ? { ...d, ...patch } : d,
      ),
    });
  const addOH = () =>
    patchOpenings({ overheadDoors: [...o.overheadDoors, { ...DEFAULT_OH }] });
  const removeOH = (i: number) =>
    patchOpenings({
      overheadDoors: o.overheadDoors.filter((_, idx) => idx !== i),
    });

  // ── Entry doors ───────────────────────────────────────────────
  const updateEntry = (i: number, patch: Partial<EntryDoor>) =>
    patchOpenings({
      entryDoors: o.entryDoors.map((d, idx) =>
        idx === i ? { ...d, ...patch } : d,
      ),
    });
  const addEntry = () =>
    patchOpenings({ entryDoors: [...o.entryDoors, { ...DEFAULT_ENTRY }] });
  const removeEntry = (i: number) =>
    patchOpenings({
      entryDoors: o.entryDoors.filter((_, idx) => idx !== i),
    });

  // ── Windows ───────────────────────────────────────────────────
  const updateWindow = (i: number, patch: Partial<Wnd>) =>
    patchOpenings({
      windows: o.windows.map((w, idx) => (idx === i ? { ...w, ...patch } : w)),
    });
  const addWindow = () =>
    patchOpenings({ windows: [...o.windows, { ...DEFAULT_WINDOW }] });
  const removeWindow = (i: number) =>
    patchOpenings({ windows: o.windows.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-400">
        Add overhead doors, entry doors, and windows. Position is the distance
        in feet from the left edge of the chosen wall.
      </p>

      {/* OVERHEAD DOORS */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">Overhead doors</h3>
        {o.overheadDoors.length === 0 && (
          <p className="text-sm text-zinc-500 italic">No overhead doors yet.</p>
        )}
        {o.overheadDoors.map((d, i) => (
          <RemovableCard
            key={i}
            title={`Door ${i + 1}`}
            onRemove={() => removeOH(i)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumberInput
                label="Width"
                unit="ft"
                min={4}
                max={24}
                value={d.widthFt}
                onChange={(v) => updateOH(i, { widthFt: v })}
              />
              <NumberInput
                label="Height"
                unit="ft"
                min={6}
                max={20}
                value={d.heightFt}
                onChange={(v) => updateOH(i, { heightFt: v })}
              />
              <ToggleGroup
                label="Wall"
                columns={4}
                value={d.wall}
                onChange={(v) => updateOH(i, { wall: v as Wall })}
                options={WALLS}
              />
              <NumberInput
                label="Position"
                unit="ft"
                min={0}
                value={d.positionFt}
                onChange={(v) => updateOH(i, { positionFt: v })}
                hint="From left edge"
              />
            </div>
            <div className="mt-3">
              <ToggleGroup
                label="Type"
                columns={4}
                value={d.type}
                onChange={(v) => updateOH(i, { type: v as OverheadDoorType })}
                options={OH_TYPES}
              />
            </div>
          </RemovableCard>
        ))}
        <AddButton onClick={addOH} label="Add overhead door" />
      </section>

      {/* ENTRY DOORS */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">Entry doors</h3>
        {o.entryDoors.length === 0 && (
          <p className="text-sm text-zinc-500 italic">No entry doors yet.</p>
        )}
        {o.entryDoors.map((d, i) => (
          <RemovableCard
            key={i}
            title={`Entry ${i + 1}`}
            onRemove={() => removeEntry(i)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumberInput
                label="Width"
                unit="ft"
                min={2.5}
                step={0.5}
                max={8}
                value={d.widthFt}
                onChange={(v) => updateEntry(i, { widthFt: v })}
              />
              <NumberInput
                label="Height"
                unit="ft"
                min={6}
                max={10}
                value={d.heightFt}
                onChange={(v) => updateEntry(i, { heightFt: v })}
              />
              <ToggleGroup
                label="Wall"
                columns={4}
                value={d.wall}
                onChange={(v) => updateEntry(i, { wall: v as Wall })}
                options={WALLS}
              />
              <NumberInput
                label="Position"
                unit="ft"
                min={0}
                value={d.positionFt}
                onChange={(v) => updateEntry(i, { positionFt: v })}
              />
            </div>
            <div className="mt-3">
              <ToggleGroup
                label="Type"
                columns={3}
                value={d.type}
                onChange={(v) => updateEntry(i, { type: v as EntryDoorType })}
                options={ENTRY_TYPES}
              />
            </div>
          </RemovableCard>
        ))}
        <AddButton onClick={addEntry} label="Add entry door" />
      </section>

      {/* WINDOWS */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">Windows</h3>
        {o.windows.length === 0 && (
          <p className="text-sm text-zinc-500 italic">No windows yet.</p>
        )}
        {o.windows.map((w, i) => (
          <RemovableCard
            key={i}
            title={`Window ${i + 1}`}
            onRemove={() => removeWindow(i)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumberInput
                label="Width"
                unit="ft"
                min={1}
                step={0.5}
                max={20}
                value={w.widthFt}
                onChange={(v) => updateWindow(i, { widthFt: v })}
              />
              <NumberInput
                label="Height"
                unit="ft"
                min={1}
                step={0.5}
                max={20}
                value={w.heightFt}
                onChange={(v) => updateWindow(i, { heightFt: v })}
              />
              <ToggleGroup
                label="Wall"
                columns={4}
                value={w.wall}
                onChange={(v) => updateWindow(i, { wall: v as Wall })}
                options={WALLS}
              />
              <NumberInput
                label="Position"
                unit="ft"
                min={0}
                value={w.positionFt}
                onChange={(v) => updateWindow(i, { positionFt: v })}
              />
            </div>
            <div className="mt-3">
              <ToggleGroup
                label="Type"
                value={w.type}
                onChange={(v) => updateWindow(i, { type: v as WindowType })}
                options={WINDOW_TYPES}
              />
            </div>
          </RemovableCard>
        ))}
        <AddButton onClick={addWindow} label="Add window" />
      </section>
    </div>
  );
}
