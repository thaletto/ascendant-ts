import { Effect } from "effect";

import { AstroParams } from "../astro-params/service.js";
import { generate } from "../chart/generate.js";
import { ChartParams, Longitude, Moment, type Planets } from "../chart/model.js";
import { Ephemeris } from "../ephemeris/service.js";
import { TransitSearchExhausted, TransitValidationError } from "./error.js";
import {
  TransitEvent,
  type TransitDirection,
  type TransitKind,
  type TransitRequest,
} from "./model.js";
import { normalize360, dateTimeFromJd, searchRawHits, type FixedTarget } from "./search.js";

const MAX_COUNT = 100;
const MAX_YEARS = 200;

const validateRequest = Effect.fn("Transit.validateRequest")(function* (request: TransitRequest) {
  const invalid = (message: string) => TransitValidationError.make({ message, cause: request });
  if (!Number.isInteger(request.count) || request.count < 1 || request.count > MAX_COUNT) {
    return yield* invalid(`count must be an integer between 1 and ${MAX_COUNT}`);
  }
  if (request.kinds.length === 0) {
    return yield* invalid("kinds must name at least one Transit event kind");
  }
  if (request.kinds.includes("longitude-hit") && request.targetLongitude === undefined) {
    return yield* invalid("targetLongitude is required for longitude-hit searches");
  }
  if (request.kinds.includes("cusp-crossing") && request.house === undefined) {
    return yield* invalid("house is required for cusp-crossing searches");
  }
  const maxYears = request.maxYears ?? 30;
  if (!Number.isFinite(maxYears) || maxYears <= 0 || maxYears > MAX_YEARS) {
    return yield* invalid(`maxYears must be between 0 (exclusive) and ${MAX_YEARS}`);
  }
  const precisionMinutes = request.precisionMinutes ?? 1;
  if (!Number.isFinite(precisionMinutes) || precisionMinutes <= 0 || precisionMinutes > 1440) {
    return yield* invalid("precisionMinutes must be between 0 (exclusive) and 1440");
  }
});

/**
 * Finds the next or previous Transit events for one graha from a Located
 * Moment. Cusp targets are the natal house cusps at `from` under the shared
 * AstroParams; Charts attach afterwards only when `includeCharts` asks.
 */
export const findTransits = Effect.fn("Transit.findTransits")(function* (request: TransitRequest) {
  yield* validateRequest(request);
  const astroParams = yield* AstroParams;
  const ephemeris = yield* Ephemeris;

  const fromJulianDay = yield* ephemeris.dateToJulianDay(request.from.moment.date);
  const fromJd = Number(fromJulianDay);

  const fixedTargets: Array<FixedTarget> = [];
  if (request.kinds.includes("longitude-hit" satisfies TransitKind)) {
    fixedTargets.push({
      kind: "longitude-hit",
      longitude: normalize360(Number(request.targetLongitude)),
    });
  }
  if (request.kinds.includes("cusp-crossing" satisfies TransitKind)) {
    const houses = yield* ephemeris.calculateHouses(
      fromJulianDay,
      request.from.latitude,
      request.from.longitude,
      astroParams.houseSystem,
      astroParams.ayanamsa,
    );
    const cusp = houses.cusps[request.house!];
    if (cusp === undefined || !Number.isFinite(cusp)) {
      return yield* TransitValidationError.make({
        message: `No cusp found for house ${request.house}`,
        cause: houses.cusps,
      });
    }
    fixedTargets.push({ kind: "cusp-crossing", longitude: normalize360(cusp) });
  }

  const planet: Planets = request.planet;
  const direction: TransitDirection = request.direction;
  const outcome = yield* searchRawHits({
    planet,
    fromJulianDay: fromJd,
    direction,
    count: request.count,
    includeIngress: request.kinds.includes("sign-ingress" satisfies TransitKind),
    includeStations: request.kinds.includes("station" satisfies TransitKind),
    fixedTargets,
    ayanamsa: astroParams.ayanamsa,
  });

  const provenance = {
    school: "Ascendant",
    method: "transit-sample-bisect",
    version: 1,
  } as const;
  const events = outcome.hits.map((hit) =>
    TransitEvent.make({
      planet,
      moment: dateTimeFromJd(hit.julianDay),
      longitude: Longitude.make(normalize360(hit.longitude)),
      kind: hit.kind,
      sign: hit.sign,
      is_retrograde: hit.speed < 0,
      direction,
      provenance,
    }),
  );

  if (!outcome.complete) {
    return yield* TransitSearchExhausted.make({
      message: `Found ${events.length} of ${request.count} events within ${request.maxYears ?? 30} years`,
      found: events,
      searchedUntil: dateTimeFromJd(outcome.endJulianDay),
    });
  }

  const divisions = request.includeCharts ?? [];
  if (divisions.length === 0) return events;
  return yield* Effect.all(
    events.map((event) =>
      Effect.gen(function* () {
        const input = ChartParams.make({
          moment: Moment.make({ date: event.moment }),
          latitude: request.from.latitude,
          longitude: request.from.longitude,
        });
        const calculation = yield* generate(input, divisions);
        return TransitEvent.make({
          planet: event.planet,
          moment: event.moment,
          longitude: event.longitude,
          kind: event.kind,
          ...(event.sign === undefined ? {} : { sign: event.sign }),
          is_retrograde: event.is_retrograde,
          direction: event.direction,
          provenance: event.provenance,
          calculation,
        });
      }),
    ),
    { concurrency: "unbounded" },
  );
});
