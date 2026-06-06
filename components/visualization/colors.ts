/**
 * Color resolver for the 3D viewport.
 *
 * BuildingConfig stores siding/trim colors as free-text strings (the
 * customer can type any color name or hex). The 3D scene needs hex codes
 * to feed three.js materials. This resolver maps the GNP preset names to
 * approximate hex equivalents and passes hex codes through.
 */

const PRESET_COLORS: Record<string, string> = {
  // GNP standard siding palette
  charcoal: "#2f2e30",
  black: "#0a0a0a",
  white: "#f5f5f5",
  cream: "#f5efdb",
  "burnished slate": "#3a3530",
  "barn red": "#7a1f1f",
  "forest green": "#1e4030",
  galvalume: "#bcbec1",
  cedar: "#a37b5c",

  // Common extras the customer might type
  brown: "#6d4c3e",
  tan: "#c4a576",
  gray: "#6b7280",
  grey: "#6b7280",
  blue: "#2c507f",
  green: "#1e4030",
  red: "#7a1f1f",
  beige: "#dfd2b3",
};

export function resolveColor(input: string, fallback = "#9ca3af"): string {
  if (!input) return fallback;
  const s = input.trim();
  // Hex code passthrough (#fff, #ffffff, #ffffffff)
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return s;
  // Named CSS color: try preset map
  const key = s.toLowerCase();
  if (key in PRESET_COLORS) return PRESET_COLORS[key];
  return fallback;
}
