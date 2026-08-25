import { Effect } from "effect";

import type { Placements } from "../../internal/model.js";
import * as ArudhaPada from "../arudha-pada/index.js";
import { EvidenceError } from "./model.js";

export const upapadaFromArudhaPada = (
  arudhaPada: Awaited<ReturnType<typeof ArudhaPada.calculate>>,
): ReturnType<typeof ArudhaPada.calculate> => arudhaPada;

export const calculateUpapada = (placements: Placements) =>
  ArudhaPada.calculate(placements, 12).pipe(
    Effect.mapError((error: ArudhaPada.EvidenceError) =>
      EvidenceError.make({
        placement: error.placement,
        expected: 1,
        actual: error.actual,
      }),
    ),
  );
