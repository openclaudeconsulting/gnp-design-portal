/**
 * GNP Design Portal — legal / engineering disclaimers
 *
 * All disclaimer text lives here. Edit ONCE here; the UI imports from this
 * file — do NOT inline disclaimer copy in components.
 *
 * NON-NEGOTIABLE: never imply the portal produces stamped, permit-ready,
 * or wind-rated plans. The portal produces an ENGINEERING SUBMITTAL PACKAGE
 * that a licensed PE seals separately and site-specifically.
 */

export const DISCLAIMERS = {
  /** Shown next to the live quote and on the review screen. */
  QUOTE: `This is a BALLPARK QUOTE generated from your current configuration. It is NOT a firm contract price. Final pricing is confirmed after engineering review and material takeoff. Pricing may vary based on site conditions, material availability, and the engineered specifications confirmed by our licensed Professional Engineer.`,

  /** Shown on the site/hazard step and the review screen. */
  ENGINEERING: `This configuration is SUBMITTED FOR ENGINEERING REVIEW. It has not been stamped, sealed, or approved for permit. Wind ratings, structural sizing, and load calculations are site-specific and must be reviewed and sealed by a Professional Engineer licensed in the build state for the SPECIFIC site where the structure will be erected. GNP Steel Trusses does not issue permit-ready plans without the PE's seal.`,

  /** Shown on the review screen + customer-facing submittal. */
  ERECTION: `GNP Steel Trusses supplies engineered + sealed plan packages and the steel truss / kit components. Erection of habitable structures must be performed by a licensed builder/contractor in the project state.`,

  /** Shown on the confirmation page + downstream submittal docs. */
  PLAN_LICENSE: `The final stamped plan set is licensed for a SINGLE build at the address listed on the engineering submittal. Re-use for additional structures requires a separate plan license.`,

  /** Shown on the confirmation page after a successful submit. */
  SUBMIT_CONFIRMATION: `Your design has been submitted for engineering review. A licensed Professional Engineer will review the configuration against the site-specific wind exposure and risk category, may request clarifications, and will produce a sealed plan set if the design is approvable as drawn. You'll receive an updated quote with final pricing once engineering is complete. Typical turnaround is 5-10 business days.`,
} as const;
