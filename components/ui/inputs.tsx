"use client";

/**
 * Reusable form input primitives for the design portal wizard.
 *
 * All inputs follow the same visual language (dark zinc + amber focus +
 * monospace numeric readouts) so the wizard feels cohesive across steps.
 */

import type { ReactNode } from "react";

// ──────────────────────────────────────────────────────────────────────────
// Generic labeled wrapper
// ──────────────────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-zinc-300 mb-1.5">{label}</div>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </label>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Number input
// ──────────────────────────────────────────────────────────────────────────

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-stretch gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
        {unit && (
          <span className="self-center text-sm text-zinc-500 w-10">{unit}</span>
        )}
      </div>
    </Field>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Select input
// ──────────────────────────────────────────────────────────────────────────

export function SelectInput<T extends string | number>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}) {
  const isNumeric = typeof options[0]?.value === "number";
  return (
    <Field label={label} hint={hint}>
      <select
        value={String(value)}
        onChange={(e) =>
          onChange((isNumeric ? Number(e.target.value) : e.target.value) as T)
        }
        className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Checkbox / boolean toggle
// ──────────────────────────────────────────────────────────────────────────

export function CheckboxInput({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-2 focus:ring-amber-500/40"
      />
      <div>
        <div className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100">
          {label}
        </div>
        {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      </div>
    </label>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Toggle group — visual radio buttons
// ──────────────────────────────────────────────────────────────────────────

export function ToggleGroup<T extends string | number>({
  label,
  value,
  onChange,
  options,
  hint,
  columns = "auto",
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; desc?: string }[];
  hint?: string;
  /** Force the grid column count; "auto" = responsive 1/2/3 cols. */
  columns?: "auto" | 2 | 3 | 4 | 5;
}) {
  // Static class strings so Tailwind v4's tree-shaker keeps them.
  const gridClass =
    columns === "auto"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
      : columns === 2
        ? "grid grid-cols-2 gap-2"
        : columns === 3
          ? "grid grid-cols-3 gap-2"
          : columns === 4
            ? "grid grid-cols-2 sm:grid-cols-4 gap-2"
            : "grid grid-cols-2 sm:grid-cols-5 gap-2";

  return (
    <Field label={label} hint={hint}>
      <div className={gridClass}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onChange(o.value)}
              className={[
                "text-left px-3 py-2.5 rounded-md border transition-colors",
                active
                  ? "border-amber-500 bg-amber-500/10 text-amber-100 ring-1 ring-amber-500/30"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800",
              ].join(" ")}
            >
              <div className="font-medium text-sm">{o.label}</div>
              {o.desc && (
                <div className="text-xs text-zinc-500 mt-0.5">{o.desc}</div>
              )}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Read-only derived/computed field
// ──────────────────────────────────────────────────────────────────────────

export function ComputedField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-zinc-400 mb-1.5">{label}</div>
      <div className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md font-mono text-zinc-300">
        {value}
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Removable card — wraps each item in a list-of-items section (doors, etc.)
// ──────────────────────────────────────────────────────────────────────────

export function RemovableCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative rounded-md border border-zinc-700 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-500/80">
          {title}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title}`}
          className="text-zinc-500 hover:text-red-400 transition-colors text-xl leading-none px-2 -mr-2 -my-1"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Add button — full-width dashed CTA for appending to a list
// ──────────────────────────────────────────────────────────────────────────

export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-3 border-2 border-dashed border-zinc-700 hover:border-amber-500/60 hover:bg-zinc-900 rounded-md text-zinc-400 hover:text-amber-300 text-sm font-medium transition-colors"
    >
      + {label}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Color input — free-text + preset chips
// ──────────────────────────────────────────────────────────────────────────

export function ColorInput({
  label,
  value,
  onChange,
  presets = [],
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets?: string[];
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Color name or hex"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
      />
      {presets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const active = p.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={[
                  "px-2.5 py-1 text-xs rounded-full transition-colors",
                  active
                    ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                ].join(" ")}
              >
                {p}
              </button>
            );
          })}
        </div>
      )}
    </Field>
  );
}
