import { expect, test } from "@playwright/test";

// Runs against the live API (see e2e/auth.spec.ts for the setup) and needs at least one
// brand, category and size. It creates its own product and deletes it, so no existing
// variant is changed.
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

test.skip(
  STAFF_EMAIL === undefined || STAFF_PASSWORD === undefined,
  "Set E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD to put a variant on sale on the running API.",
);

test("a compare-at price above the price puts a variant on sale", async ({ page }) => {
  const name = `E2E Sale ${Date.now()}`;
  const sku = `E2E-SALE-${Date.now()}`;
  await page.goto("/login");
  await page.getByLabel("Email").fill(STAFF_EMAIL ?? "");
  await page.getByLabel("Password").fill(STAFF_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/products/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Brand").click();
  await page.getByRole("option").first().click();
  await page.getByLabel("Category").click();
  await page.getByRole("option").first().click();
  await page.getByLabel("Base price").fill("3200");
  await page.getByRole("button", { name: "Create product" }).click();
  await page.getByRole("button", { name: "Add variant" }).click();
  const sheet = page.getByRole("dialog", { name: "New variant" });
  await sheet.getByLabel("SKU").fill(sku);
  await sheet.getByLabel("Size").click();
  await page.getByRole("option").first().click();
  await sheet.getByRole("button", { name: "Add variant" }).click();

  await page.getByRole("row", { name: new RegExp(sku) }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const editSheet = page.getByRole("dialog", { name: `Edit ${sku}` });
  await editSheet.getByLabel("Price override").fill("2720");
  await editSheet.getByLabel("Compare-at price").fill("3200");
  await editSheet.getByRole("button", { name: "Save variant" }).click();

  await expect(page.getByText("−15%")).toBeVisible();
  await page.goto(`/products?q=${encodeURIComponent(name)}&on_sale=true`);
  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row.getByText("On sale")).toBeVisible();
  await row.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(`${name} deleted`)).toBeVisible();
});
