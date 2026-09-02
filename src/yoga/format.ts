import { Match } from "effect";

import type { YogaEvidence } from "./model.js";

export function formatEvidence(evidence: YogaEvidence): string {
  return Match.value(evidence).pipe(
    Match.tag(
      "BodyPositionsEvidence",
      (evidence) =>
        `${evidence.bodies.join(", ")} ${evidence.matched ? "match" : "do not match"} houses ${evidence.expectedRelativeHouses.join(", ")} from ${evidence.referenceBody}; observed ${evidence.observed.map(({ body, relativeHouse }) => `${body} in ${relativeHouse}`).join(", ")}.`,
    ),
    Match.tag(
      "BodyDignitiesEvidence",
      (evidence) =>
        `${evidence.bodies.join(", ")} match ${evidence.expectedDignities.join(" or ")} dignity and houses ${evidence.expectedRelativeHouses.join(", ")} from ${evidence.referenceBody}; observed ${evidence.observed.map(({ body, relativeHouse, dignities }) => `${body} in ${relativeHouse} (${dignities.join(", ") || "none"})`).join(", ")}.`,
    ),
    Match.tag(
      "OccupiedSignCountEvidence",
      (evidence) =>
        `${evidence.bodies.join(", ")} occupy ${evidence.observedSignCount} signs; expected ${evidence.expectedSignCount}.`,
    ),
    Match.tag(
      "SignModalityEvidence",
      (evidence) =>
        `${evidence.bodies.join(", ")} ${evidence.matched ? "are" : "are not"} all in ${evidence.expectedModality.toLocaleLowerCase()} signs; observed ${evidence.observed.map(({ body, sign, modality }) => `${body} in ${sign} (${modality.toLocaleLowerCase()})`).join(", ")}.`,
    ),
    Match.tag(
      "HouseOccupancyEvidence",
      (evidence) =>
        `Houses ${evidence.expectedRelativeHouses.join(", ")} from ${evidence.referenceBody} ${evidence.matched ? "meet" : "do not meet"} ${evidence.quantifier}; observed ${evidence.observed.map(({ relativeHouse, occupants }) => `${relativeHouse}: ${occupants.join(", ") || "empty"}`).join("; ")}.`,
    ),
    Match.tag(
      "AllEvidence",
      (evidence) =>
        `All conditions ${evidence.matched ? "match" : "do not match"}: ${evidence.children.map(formatEvidence).join(" ")}`,
    ),
    Match.tag(
      "AnyEvidence",
      (evidence) =>
        `At least one condition ${evidence.matched ? "matches" : "does not match"}: ${evidence.children.map(formatEvidence).join(" ")}`,
    ),
    Match.tag(
      "NotEvidence",
      (evidence) =>
        `Negated condition ${evidence.matched ? "matches" : "does not match"}: ${formatEvidence(evidence.child)}`,
    ),
    Match.exhaustive,
  );
}
