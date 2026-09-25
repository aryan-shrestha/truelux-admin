import { expect, test } from "@playwright/test";

import { requireLiveApi, signIn } from "@/tests/e2e/session";

requireLiveApi();

// A 1×1 transparent PNG, so the spec needs no fixture file on disk.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function chooseFirst(page: import("@playwright/test").Page, label: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option").first().click();
}

test("create a product, add a variant and an image, publish it, find it in the list", async ({ page }) => {
  const name = `E2E Serum ${Date.now()}`;
  const sku = `E2E-${Date.now()}`;
  await signIn(page);

  await page.goto("/products/new");
  await page.getByLabel("Name").fill(name);
  await chooseFirst(page, "Brand");
  await chooseFirst(page, "Category");
  await page.getByLabel("Base price").fill("2500");
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/\/products\/[^/]+\?tab=variants/);

  await page.getByLabel("SKU of new variant").fill(sku);
  await page.getByRole("combobox", { name: "Size of new variant" }).click();
  await page.getByRole("option").first().click();
  await page.getByLabel("Stock of new variant").fill("10");
  await page.getByRole("button", { name: "Add this variant" }).click();
  await expect(page.getByText(`${sku} added`)).toBeVisible();

  await page.getByRole("tab", { name: /Images/ }).click();
  await page.getByLabel("Upload images").setInputFiles({ name: "swatch.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("swatch.png uploaded")).toBeVisible();
  await expect(page.getByText("Primary", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Details" }).click();
  await page.getByRole("switch", { name: "Published" }).click();
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Product saved")).toBeVisible();

  await page.goto(`/products?q=${encodeURIComponent(name)}`);
  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Published")).toBeVisible();
});
