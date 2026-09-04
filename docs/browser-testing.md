# Browser Testing Plan

The browser boundary is complete only when its built artifact has repeatable
automated evidence. The project uses Playwright Test because it can start a local
static server, drive a real Chromium page, and retain screenshots/traces when a
test fails.

## Implemented setup

`@playwright/test`, TypeScript, and the TS test runner are development dependencies. `playwright.config.mjs`:

- runs `npm run build` before browser tests;
- serves `dist/` on a local fixed test URL through Playwright's `webServer`;
- uses Chromium initially, with retries only in CI and failure
  traces/screenshots in every environment;
- keeps browser specs under `tests/browser/`; and
- provides `npm run test:browser`, which `npm run check` runs after headless
  coverage.

The browser runner is a consumer of the static artifact. It must not import
private source modules or use page evaluation to calculate expected physics.
Expected model values belong in headless math/physics/game tests.

## Multi-body smoke suite

The specifications cover the public evidence boundary:

| Interaction | Assertion |
| --- | --- |
| Load the page | title, heading, multi-body SVG, controls, two bodies, eight particles, and step `0` are visible |
| Step | the displayed step becomes `1` and a returned contact count appears |
| Nudge | a named body advances through the game command path |
| Reset | displayed step, body count, and contact count return to the initial scene |
| Play/pause | visible control state changes without browser errors or duplicate controls |

Use role/name locators for controls and accessible text/labels for evidence.
Use a screenshot or ARIA snapshot only for the stable inspector layout, not as
the sole proof of physics behavior.

## Artifacts and responsibilities

On failure, Playwright retains trace and screenshot artifacts in ignored local
result directories. CI runs the same `npm run check` gate before publishing the
static artifact to GitHub Pages. A
browser failure diagnoses the browser/game boundary; it does not loosen a
headless physics assertion. New overlays and controls require one smoke test
that proves they display an existing public record rather than browser-derived
analysis.

## Completed admission gate

The focused Phase 3 unit is complete: dependency, static server, five smoke
cases, and failure artifacts. Do not add cross-browser matrices, visual-diff
baselines, or end-to-end game scenarios until a concrete game feature needs
them.
