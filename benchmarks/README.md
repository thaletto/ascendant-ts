# Yoga benchmark

`bun run benchmark:yoga` compares the Yoga Service with internal orchestration concurrency set to one and to the production value of four. It uses one deterministic D1 Chart calculation, warms each service for 100 evaluations, and measures both the ten-rule pilot and an explicitly assembled synthetic 300-rule catalog.

Observed on 2026-08-23 with Bun 1.4.0 on arm64:

| Catalog                         | Iterations | Concurrency 1 | Concurrency 4 |
| ------------------------------- | ---------: | ------------: | ------------: |
| Ten-rule pilot                  |      2,000 |        0.50 s |        0.44 s |
| Synthetic 300-rule scale sample |        250 |        1.15 s |        1.07 s |

This is a non-gating developer benchmark. The predicates are synchronous, so Effect fiber concurrency does not imply four-core execution; results vary by runtime and machine.
