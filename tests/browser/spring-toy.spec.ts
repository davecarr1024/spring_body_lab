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
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByRole("button")).toHaveCount(13);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
