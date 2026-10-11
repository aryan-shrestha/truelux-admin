import { expect, test } from "@playwright/test";

// Runs against the live API with demo orders (see e2e/auth.spec.ts for the setup).
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

test.skip(
  STAFF_EMAIL === undefined || STAFF_PASSWORD === undefined,
  "Set E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD to browse orders on the running API.",
);

test("staff open an order from the list and come back to the same filter", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(STAFF_EMAIL ?? "");
  await page.getByLabel("Password").fill(STAFF_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Orders" })
    .click();
  await page.getByRole("tab", { name: "Delivered" }).click();
  await expect(page).toHaveURL(/status=delivered/);

  await page.getByRole("link", { name: /^TL-/ }).first().click();
  await expect(page.getByRole("heading", { name: /^TL-/ })).toBeVisible();
  await page.goBack();

  await expect(page).toHaveURL(/status=delivered/);
  await expect(page.getByRole("tab", { name: "Delivered" })).toHaveAttribute(
    "data-state",
    "active",
  );
});
