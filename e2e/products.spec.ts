import { expect, test } from "@playwright/test";

// Runs against the live API (see e2e/auth.spec.ts for the setup) and needs at least one
// brand, category and size. It creates a product and deletes it again.
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

// A 1×1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

test.skip(
  STAFF_EMAIL === undefined || STAFF_PASSWORD === undefined,
  "Set E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD to edit products on the running API.",
);

test("staff create a product, give it a variant and an image, publish it and delete it", async ({
  page,
}) => {
  const name = `E2E Product ${Date.now()}`;
  const sku = `E2E-${Date.now()}`;
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
  await page.getByLabel("Base price").fill("1500");
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/tab=variants/);

  await page.getByRole("button", { name: "Add variant" }).click();
  const sheet = page.getByRole("dialog", { name: "New variant" });
  await sheet.getByLabel("SKU").fill(sku);
  await sheet.getByLabel("Size").click();
  await page.getByRole("option").first().click();
  await sheet.getByRole("button", { name: "Add variant" }).click();
  await expect(page.getByRole("cell", { name: sku })).toBeVisible();

  await page.getByRole("tab", { name: "Images" }).click();
  await page.getByLabel("Upload images").setInputFiles({
    name: "dot.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.getByLabel("Alt text of image 1")).toBeVisible();

  await page.getByRole("tab", { name: "Details" }).click();
  await page.getByRole("switch", { name: "Published" }).click();
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Product saved")).toBeVisible();

  await page.goto(`/products?q=${encodeURIComponent(name)}`);
  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row.getByText("Published")).toBeVisible();
  await row.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText(`${name} deleted`)).toBeVisible();
});
