/**
 * Client-safe deal stage constants and types.
 *
 * Lives in a separate file from `deal-store.ts` so that React Client
 * Components can import these constants without webpack trying to bundle
 * Node's `fs` / `path` modules into the browser build.
 */

export type DealStage =
  | "QUALIFICATION"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export const STAGE_ORDER: DealStage[] = [
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export const STAGE_LABEL: Record<DealStage, string> = {
  QUALIFICATION: "Qualification",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Won",
  CLOSED_LOST: "Lost",
};
