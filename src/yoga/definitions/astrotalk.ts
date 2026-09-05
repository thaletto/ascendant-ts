import { Effect } from "effect";

import { evaluateCondition } from "../evaluate.js";
import { formatEvidence } from "../format.js";
import { evaluateFormation, type FormationCondition } from "../formation.js";
import { YogaStrategy, type YogaDefinition } from "../internal.js";
import { YogaIds, type FormationEvidence, type YogaClassification } from "../model.js";
import { astrotalk1To100 } from "./astrotalk-1-100.js";
import { astrotalk101To175 } from "./astrotalk-101-175.js";
import { astrotalk176To244 } from "./astrotalk-176-244.js";
import { astrotalk245To300 } from "./astrotalk-245-300.js";
import { astrotalkSourceRows } from "./astrotalk-source.js";

export interface AstrotalkFormation {
  readonly row: number;
  readonly name: string;
  readonly classification: YogaClassification;
  readonly description: string;
  readonly condition: FormationCondition;
}

export const astrotalkFormations: readonly AstrotalkFormation[] = [
  ...astrotalk1To100,
  ...astrotalk101To175,
  ...astrotalk176To244,
  ...astrotalk245To300,
];

function asFormationEvidence(evidence: import("../model.js").YogaEvidence): FormationEvidence {
  if (evidence._tag === "FormationEvidence") return evidence;
  return {
    _tag: "FormationEvidence",
    operation: "ExistingFormation",
    matched: evidence.matched,
    reasons: [],
    observations: [formatEvidence(evidence)],
    children: [],
  };
}

/** Merge only source-equivalent descriptions, retaining each formation's evidence. */
export function extendWithAstrotalk(
  existing: readonly YogaDefinition[],
): readonly YogaDefinition[] {
  const result: YogaDefinition[] = existing.map((definition): YogaDefinition => ({
    requiredDivisions: definition.requiredDivisions,
    strategy: definition.strategy,
    yoga: {
      id: definition.yoga.id,
      name: definition.yoga.name,
      aliases: definition.yoga.aliases,
      classification: definition.yoga.classification,
      description: definition.yoga.description,
      formations: astrotalkSourceRows
        .filter(
          ({ id, excluded, row }) =>
            id === definition.yoga.id &&
            !excluded &&
            !astrotalkFormations.some((formation) => formation.row === row),
        )
        .map(({ row }) => ({ sourceRow: row, description: definition.yoga.description })),
    },
  }));
  const groups = new Map<string, AstrotalkFormation[]>();
  for (const formation of astrotalkFormations) {
    const source = astrotalkSourceRows.find(({ row }) => row === formation.row);
    if (source === undefined || source.excluded) continue;
    const group = groups.get(source.id) ?? [];
    group.push(formation);
    groups.set(source.id, group);
  }
  for (const [id, formations] of groups) {
    const first = formations[0];
    if (first === undefined) continue;
    const existingIndex = result.findIndex(({ yoga }) => yoga.id === id);
    const previous = result[existingIndex];
    // Row 81 corrects the earlier opposing-kendra Gada interpretation. Rows
    // 91-97 explicitly count the seven classical planets. These source rules
    // replace the earlier definitions rather than adding false alternatives.
    const replacesPrevious = formations.some(({ row }) => row === 81 || (row >= 91 && row <= 97));
    const retained = replacesPrevious ? undefined : previous;
    const definition: YogaDefinition = {
      yoga: {
        id: YogaIds.make(id),
        name: first.name,
        aliases: previous?.yoga.aliases ?? [],
        classification: first.classification,
        description: [
          retained?.yoga.description,
          ...formations.map(({ description }) => description),
        ]
          .filter((description) => description !== undefined)
          .join(" Alternative: "),
        formations: [
          ...(retained === undefined
            ? []
            : astrotalkSourceRows
                .filter(
                  (source) =>
                    source.id === id &&
                    !source.excluded &&
                    !formations.some(({ row }) => row === source.row),
                )
                .map(({ row }) => ({ sourceRow: row, description: retained.yoga.description }))),
          ...formations.map(({ row, description }) => ({ sourceRow: row, description })),
        ],
      },
      requiredDivisions: [1],
      strategy: YogaStrategy.Evaluator({
        name: "AstrotalkFormations",
        evaluate: Effect.fn("Yoga.evaluateAstrotalkGroup")(function* (index) {
          const children: FormationEvidence[] = [];
          if (retained !== undefined) {
            const evidence = yield* YogaStrategy.$match(retained.strategy, {
              Condition: ({ condition }) => evaluateCondition(condition, index),
              Evaluator: ({ evaluate }) => evaluate(index),
            });
            children.push(asFormationEvidence(evidence));
          }
          for (const formation of formations) {
            const evidence = yield* evaluateFormation(formation.condition, index);
            children.push({
              _tag: "FormationEvidence",
              operation: `Astrotalk row ${formation.row}`,
              matched: evidence.matched,
              reasons: evidence.reasons,
              observations: [formation.description, ...evidence.observations],
              children: evidence.children,
            });
          }
          return {
            _tag: "FormationEvidence" as const,
            operation: "AlternativeFormations",
            matched: children.some(({ matched }) => matched === true)
              ? true
              : children.some(({ matched }) => matched === null)
                ? null
                : false,
            reasons: children.flatMap(({ reasons }) => reasons),
            observations: [],
            children,
          };
        }),
      }),
    };
    if (existingIndex < 0) result.push(definition);
    else result[existingIndex] = definition;
  }
  return result;
}
