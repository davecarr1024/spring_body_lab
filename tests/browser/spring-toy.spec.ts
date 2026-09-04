import { expect, test } from "@playwright/test";

async function openToy(page) {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  return pageErrors;
}

test("the built browser artifact presents the initial multiple-body lab", async ({ page }) => {
  const pageErrors = await openToy(page);
  await expect(page).toHaveTitle("Spring Body Lab");
  await expect(page.getByRole("heading", { name: "Deformable bodies, visible causes." })).toBeVisible();
  await expect(page.getByRole("img", { name: "Multiple soft bodies in a fixed contact arena" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
  await expect(page.getByTestId("step-value")).toHaveText("0");
  await expect(page.getByTestId("body-count")).toHaveText("2");
  await expect(page.getByTestId("particle-count")).toHaveText("8");
  await expect(page.getByTestId("component-count")).toHaveText("2");
  await expect(page.getByTestId("broken-spring-count")).toHaveText("0");
  await expect(page.getByTestId("diagnostic-count")).toHaveText("0");
  await expect(page.getByTestId("recipe-size")).toHaveText(/\d+/);
  expect(pageErrors).toEqual([]);
});

test("Step renders the returned physics contact evidence", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Step" }).click();
  await expect(page.getByTestId("step-value")).toHaveText("1");
  await expect(page.getByTestId("contact-count")).toHaveText(/\d+/);
  expect(pageErrors).toEqual([]);
});

test("body nudges advance the game command path", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Nudge amber" }).click();
  await expect(page.getByTestId("step-value")).toHaveText("1");
  await expect(page.getByTestId("break-count")).not.toHaveText("0");
  await expect(page.getByTestId("broken-spring-count")).not.toHaveText("0");
  expect(pageErrors).toEqual([]);
});

test("the browser exposes a reproducible weak-wall breach goal", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Load weak wall" }).click();
  await expect(page.getByRole("img", { name: "Weak wall breach arena" })).toBeVisible();
  await expect(page.getByTestId("scene-name")).toHaveText("Weak wall breach");
  await expect(page.getByTestId("goal-status")).toHaveText("Break 4 weak seams");
  await page.getByRole("button", { name: "Ram wall" }).click();
  await expect(page.getByTestId("goal-status")).toHaveText("Breach achieved");
  await expect(page.getByTestId("broken-spring-count")).toHaveText("4");
  expect(pageErrors).toEqual([]);
});

test("the browser exposes a deterministic rope-swing goal", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Load rope" }).click();
  await expect(page.getByRole("img", { name: "Rope swing arena" })).toBeVisible();
  await expect(page.getByTestId("scene-name")).toHaveText("Rope swing");
  await expect(page.getByTestId("goal-status")).toHaveText("Move rope tail past marker");
  await page.getByRole("button", { name: "Swing rope" }).click();
  await expect(page.getByTestId("goal-status")).toHaveText("Swing achieved");
  await expect(page.getByTestId("step-value")).toHaveText("1");
  expect(pageErrors).toEqual([]);
});

test("the browser exposes a deterministic sheet-lift goal", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Load sheet" }).click();
  await expect(page.getByRole("img", { name: "Sheet lift arena" })).toBeVisible();
  await expect(page.getByTestId("goal-status")).toHaveText("Lift sheet edge to marker");
  await page.getByRole("button", { name: "Lift sheet" }).click();
  await expect(page.getByTestId("goal-status")).toHaveText("Lift achieved");
  expect(pageErrors).toEqual([]);
});

test("the browser exposes a contact-proven block ram goal", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Load block ram" }).click();
  await expect(page.getByRole("img", { name: "Block ram arena" })).toBeVisible();
  await page.getByRole("button", { name: "Launch ram" }).click();
  await expect(page.getByTestId("goal-status")).toHaveText("Ram contact achieved");
  await expect(page.getByTestId("contact-count")).not.toHaveText("0");
  expect(pageErrors).toEqual([]);
});

test("Breach Run joins bodies, arena, player action, and objective in one mission", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Start Breach Run" }).click();
  await expect(page.getByRole("img", { name: "Breach Run arena" })).toBeVisible();
  await expect(page.getByTestId("scene-name")).toHaveText("Breach Run");
  await expect(page.getByTestId("goal-status")).toHaveText("Objective: breach the weak wall");
  await expect(page.getByTestId("body-count")).toHaveText("2");
  await expect(page.getByTestId("particle-count")).toHaveText("11");
  await page.getByRole("button", { name: "Fire breach charge" }).click();
  await expect(page.getByTestId("goal-status")).toHaveText("Mission complete");
  await expect(page.getByTestId("broken-spring-count")).toHaveText("4");
  await expect(page.getByTestId("contact-count")).not.toHaveText("0");
  expect(pageErrors).toEqual([]);
});

test("Mossyard Courier runs live and gives keyboard, mouse, texture, and goal feedback", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Play Mossyard" }).click();
  await expect(page.getByRole("img", { name: "Mossyard Courier playable garden" })).toBeVisible();
  await expect(page.getByTestId("mission-title")).toHaveText("DELIVERY 01 · MOON GATE");
  await expect(page.getByTestId("control-hint")).toContainText("WASD or arrow keys");
  await expect(page.locator("button:visible")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset", exact: true })).toBeVisible();
  await expect(page.locator("polygon.skin-face").first()).toHaveAttribute("fill", /url\(#skin-moss\)/);
  await expect(page.locator("pattern image").first()).toHaveAttribute("href", /assets\//);
  await expect.poll(async () => Number(await page.getByTestId("step-value").textContent())).toBeGreaterThan(1);
  await page.keyboard.down("ArrowRight");
  await expect(page.getByTestId("input-status")).toHaveText("Keyboard steering active.");
  await expect(page.getByTestId("goal-status")).toHaveText("Gate reached — delivery complete!", { timeout: 3000 });
  await page.keyboard.up("ArrowRight");
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("img", { name: "Mossyard Courier playable garden" }).click({ position: { x: 400, y: 100 } });
  await expect(page.getByTestId("input-status")).toHaveText("Pointer course set — the courier is following it.");
  await expect.poll(async () => Number(await page.getByTestId("step-value").textContent())).toBeGreaterThan(1);
  expect(pageErrors).toEqual([]);
});

test("Mossyard is available as a focused standalone playable demo", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/mossyard.html");
  await expect(page).toHaveTitle("Mossyard Courier");
  await expect(page.getByRole("img", { name: "Mossyard Courier playable garden" })).toBeVisible();
  await expect(page.getByTestId("input-status")).toHaveText("Courier awake — steer toward the moon gate.");
  await expect.poll(async () => Number(await page.getByTestId("step-value").textContent())).toBeGreaterThan(1);
  expect(pageErrors).toEqual([]);
});

test("Trail Driver is a separate keyboard-controlled terrain page without debug particle circles", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/trail.html");
  await expect(page).toHaveTitle("Trail Driver");
  await expect(page.getByRole("img", { name: "Trail Driver heightfield" })).toBeVisible();
  await expect(page.locator("polygon.skin-face")).toHaveCount(2);
  await expect(page.locator("circle.particle")).toHaveCount(0);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(100);
  await page.keyboard.up("ArrowRight");
  expect(errors).toEqual([]);
});

test("Reset restores the initial multi-body scene", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Step" }).click();
  await page.getByRole("button", { name: "Nudge blue" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByTestId("step-value")).toHaveText("0");
  await expect(page.getByTestId("body-count")).toHaveText("2");
  await expect(page.getByTestId("contact-count")).toHaveText("0");
  expect(pageErrors).toEqual([]);
});

test("Play and Pause retain one accessible control set without page errors", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(page.getByRole("button")).toHaveCount(16);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
