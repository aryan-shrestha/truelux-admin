import { expect, test } from "@playwright/test";

import { deleteListed } from "@/tests/e2e/cleanup";
import { requireLiveApi, signIn } from "@/tests/e2e/session";

requireLiveApi();

const name = `E2E Serum ${Date.now()}`;

test.afterEach(async ({ page }) => {
  await deleteListed(page, { path: "/products", name, confirm: "Delete product" });
});

// A 1×1 transparent PNG, so the spec needs no fixture file on disk.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function chooseFirst(page: import("@playwright/test").Page, label: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option").first().click();
}

test("create a product, add a variant and an image, publish it, find it in the list", async ({
  page,
}) => {
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
  await page
    .getByLabel("Upload images")
    .setInputFiles({ name: "swatch.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("swatch.png uploaded")).toBeVisible();
  await expect(page.getByText("Primary", { exact: true })).toBeVisible();
  const uploaded = page.getByRole("tabpanel").locator("img");
  await expect(uploaded).toHaveJSProperty("complete", true);
  expect(await uploaded.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  await page.getByRole("tab", { name: "Details" }).click();
  const skinTypes = page.getByRole("combobox", { name: "Skin types" });
  await skinTypes.click();
  await page.getByRole("option", { name: "Dry" }).click();
  await page.getByRole("option", { name: "Sensitive" }).click();
  await page.keyboard.press("Escape");
  await page.getByLabel("Skin feel").fill("Soothed, balanced");
  await page.getByLabel("Key ingredients").fill("Water (Aqua), Niacinamide");
  await page.getByRole("switch", { name: "Published" }).click();
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Product saved")).toBeVisible();

  await page.reload();
  await expect(skinTypes).toContainText("Dry");
  await expect(skinTypes).toContainText("Sensitive");
  await expect(page.getByLabel("Skin feel")).toHaveValue("Soothed, balanced");

  await page.goto(`/products?q=${encodeURIComponent(name)}`);
  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Published")).toBeVisible();
});
