# Browser Testing Plan

Phase 3 exits only when the built browser artifact has repeatable automated
evidence. The project will use Playwright Test because it can start a local
static server, drive a real Chromium page, and retain screenshots/traces when a
test fails.

## Intended setup

Add `@playwright/test` as a development dependency with a Playwright
configuration that:

- runs `npm run build` before browser tests;
- serves `dist/` on a local fixed test URL through Playwright's `webServer`;
- uses Chromium initially, with retries and failure traces only in CI;
- keeps browser specs under `tests/browser/`; and
- adds `npm run test:browser` and then includes it in `npm run check`.

The browser runner is a consumer of the static artifact. It must not import
private source modules or use page evaluation to calculate expected physics.
Expected model values belong in headless math/physics/game tests.

## First smoke suite

The first specifications cover the public evidence boundary:

| Interaction | Assertion |
| --- | --- |
| Load the page | title, heading, spring SVG, controls, and step `0` are visible |
| Step | the displayed step becomes `1` and a returned force/extension record appears |
| Kick | the displayed bob state changes through the game command path |
| Reset | displayed step and bob state return to the initial scene |
| Play/pause | visible control state changes without browser errors or duplicate controls |

Use role/name locators for controls and accessible text/labels for evidence.
Use a screenshot or ARIA snapshot only for the stable inspector layout, not as
the sole proof of physics behavior.

## Artifacts and responsibilities

On failure, CI should retain Playwright's trace and screenshot artifacts. A
browser failure diagnoses the browser/game boundary; it does not loosen a
headless physics assertion. New overlays and controls require one smoke test
that proves they display an existing public record rather than browser-derived
analysis.

## Admission gate

Install and configure Playwright only as one focused Phase 3 unit: dependency,
static server, five smoke cases, failure artifacts, and CI command. Do not add
cross-browser matrices, visual-diff baselines, or end-to-end game scenarios
until this small suite is stable.
