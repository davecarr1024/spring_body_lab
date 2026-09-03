import { expect, test } from "@playwright/test";

async function openToy(page) {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  return pageErrors;
}

test("the built browser artifact presents the initial spring toy", async ({ page }) => {
  const pageErrors = await openToy(page);
  await expect(page).toHaveTitle("Spring Body Lab");
  await expect(page.getByRole("heading", { name: "A game built from evidence." })).toBeVisible();
  await expect(page.getByRole("img", { name: "Two particle spring scene" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Step" })).toBeVisible();
  await expect(page.getByTestId("step-value")).toHaveText("0");
  await expect(page.getByTestId("spring-extension")).toHaveText("initial");
  expect(pageErrors).toEqual([]);
});

test("Step renders the returned physics evidence", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Step" }).click();
  await expect(page.getByTestId("step-value")).toHaveText("1");
  await expect(page.getByTestId("spring-extension")).not.toHaveText("initial");
  await expect(page.getByTestId("force-on-anchor")).not.toHaveText("initial");
  expect(pageErrors).toEqual([]);
});

test("Kick changes the displayed bob state through the game command", async ({ page }) => {
  const pageErrors = await openToy(page);
  const initialPosition = await page.getByTestId("bob-position").textContent();
  await page.getByRole("button", { name: "Kick" }).click();
  await expect(page.getByTestId("step-value")).toHaveText("1");
  await expect(page.getByTestId("bob-position")).not.toHaveText(initialPosition ?? "");
  expect(pageErrors).toEqual([]);
});

test("Reset restores the initial public scene", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Step" }).click();
  await page.getByRole("button", { name: "Kick" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByTestId("step-value")).toHaveText("0");
  await expect(page.getByTestId("bob-position")).toHaveText("300.00, 190.00");
  await expect(page.getByTestId("spring-extension")).toHaveText("initial");
  expect(pageErrors).toEqual([]);
});

test("Play and Pause retain one accessible control set without page errors", async ({ page }) => {
  const pageErrors = await openToy(page);
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByRole("button")).toHaveCount(4);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
