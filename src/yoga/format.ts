import { Match } from "effect";

import type { YogaEvidence } from "./model.js";

export function formatEvidence(evidence: YogaEvidence): string {
  return Match.value(evidence).pipe(
    Match.tag(
      "FormationEvidence",
      (evidence) =>
        `${evidence.operation}: ${evidence.matched === null ? "unresolved" : evidence.matched ? "matched" : "not matched"}. ${[
          ...evidence.observations,
          ...evidence.reasons,
          ...evidence.children.map((child) => formatEvidence(child)),
        ].join(" ")}`,
    ),
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
      "NaturalPlanetGroupPositionsEvidence",
      (evidence) =>
        `${evidence.group} ${evidence.matched ? "match" : "do not match"} houses ${evidence.expectedRelativeHouses.join(", ")} from ${evidence.referenceBody}; observed ${evidence.observed.map(({ body, relativeHouse }) => `${body} in ${relativeHouse}`).join(", ")}.`,
    ),
    Match.tag(
      "ContinuousSignWindowEvidence",
      (evidence) =>
        `${evidence.bodies.join(", ")} ${evidence.matched ? "occupy" : "do not occupy"} the consecutive signs ${evidence.expectedSigns.join(", ")} from house ${evidence.startingRelativeHouse} relative to ${evidence.referenceBody}; observed ${evidence.observed.map(({ body, sign }) => `${body} in ${sign}`).join(", ")}.`,
    ),
    Match.tag(
      "HouseOccupancyEvidence",
      (evidence) =>
        `Houses ${evidence.expectedRelativeHouses.join(", ")} from ${evidence.referenceBody} ${evidence.matched ? "meet" : "do not meet"} ${evidence.quantifier}; observed ${evidence.observed.map(({ relativeHouse, occupants }) => `${relativeHouse}: ${occupants.join(", ") || "empty"}`).join("; ")}.`,
    ),
    Match.tag(
      "HouseLordPlacementEvidence",
      (evidence) =>
        `${evidence.observed.lord} (lord of house ${evidence.lordOfHouse}) ${evidence.matched ? "is" : "is not"} in house ${evidence.expectedRelativeHouses.join(", ")} from ${evidence.referenceBody}; observed in ${evidence.observed.observedRelativeHouse}.`,
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
