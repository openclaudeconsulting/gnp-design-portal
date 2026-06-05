/**
 * GNP Design Portal — brand + contact configuration
 *
 * Centralized so the owner can edit display strings, contact info, and the
 * Professional Engineer routing target in one place.
 */

export const BRAND = {
  name: "GNP Steel Trusses",
  tagline: "Commercial & Residential",
  shortName: "GNP",
  productName: "GNP Design Portal",
  domain: "gnp-steel-trusses.com",
  email: "GNPSteelTrusses@gmail.com",
  phone: "(352) 646-9090",
  serviceArea: "Southwest Florida & South Georgia",
} as const;

/**
 * Professional Engineer routing target.
 *
 * The submit flow includes this contact in the engineering submittal payload
 * (over the n8n webhook) so the PE receives the package directly.
 *
 * ⚠ PLACEHOLDER. The owner fills in the actual licensed PE's contact info
 * (must be licensed in the build state — FL/GA — for the seal to be valid).
 * Set the values via .env, NOT by editing this file directly.
 */
export const PE_CONTACT = {
  name: process.env.PE_CONTACT_NAME ?? "PE NOT YET CONFIGURED",
  email: process.env.PE_CONTACT_EMAIL ?? "pe-contact-not-set@example.com",
  phone: process.env.PE_CONTACT_PHONE ?? "",
  licenseStates: ["FL", "GA"],
  licenseNumber: process.env.PE_LICENSE_NUMBER ?? "",
} as const;
