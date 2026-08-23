import type { YogaEvidence } from "./model.js";

export function formatEvidence(evidence: YogaEvidence): string {
  switch (evidence._tag) {
    case "BodyPositionsEvidence":
      return `${evidence.bodies.join(", ")} ${evidence.matched ? "match" : "do not match"} houses ${evidence.expectedRelativeHouses.join(", ")} from ${evidence.referenceBody}; observed ${evidence.observed.map(({ body, relativeHouse }) => `${body} in ${relativeHouse}`).join(", ")}.`;
    case "HouseOccupancyEvidence":
      return `Houses ${evidence.expectedRelativeHouses.join(", ")} from ${evidence.referenceBody} ${evidence.matched ? "meet" : "do not meet"} ${evidence.quantifier}; observed ${evidence.observed.map(({ relativeHouse, occupants }) => `${relativeHouse}: ${occupants.join(", ") || "empty"}`).join("; ")}.`;
    case "AllEvidence":
      return `All conditions ${evidence.matched ? "match" : "do not match"}: ${evidence.children.map(formatEvidence).join(" ")}`;
    case "AnyEvidence":
      return `At least one condition ${evidence.matched ? "matches" : "does not match"}: ${evidence.children.map(formatEvidence).join(" ")}`;
    case "NotEvidence":
      return `Negated condition ${evidence.matched ? "matches" : "does not match"}: ${formatEvidence(evidence.child)}`;
  }
}
