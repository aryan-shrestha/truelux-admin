import { type Page, expect, test } from "@playwright/test";

import { requireLiveApi, signIn } from "@/tests/e2e/session";

requireLiveApi();

let editorUrl = "";
let sku = "";
let original = "";

async function setCompareAt(page: Page, value: string) {
  await page.goto(editorUrl);
  const input = page.getByLabel(`Compare-at price of ${sku}`);
  await input.fill(value);
  await page.getByRole("button", { name: `Save ${sku}` }).click();
}

test.afterAll(async ({ browser }) => {
  if (!editorUrl) return;
  const page = await browser.newPage();
  await signIn(page);
  await page.goto(editorUrl);
  if ((await page.getByLabel(`Compare-at price of ${sku}`).inputValue()) !== original) {
    await setCompareAt(page, original);
    await expect(page.getByText(`${sku} saved`)).toBeVisible();
  }
  await page.close();
});

test("put a variant on sale, see it in the list, then end the sale", async ({ page }) => {
  await signIn(page);

  await page.goto("/products");
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("link") })
    .filter({ hasNotText: "On sale" })
    .first();
  const link = row.getByRole("link");
  const name = (await link.textContent()) ?? "";
  await link.click();
  await expect(page).toHaveURL(/\/products\/[^/?]+/);
  editorUrl = `${new URL(page.url()).pathname}?tab=variants`;

  await page.goto(editorUrl);
  const firstCompareAt = page.getByLabel(/^Compare-at price of /).first();
  sku = ((await firstCompareAt.getAttribute("aria-label")) ?? "").replace(
    "Compare-at price of ",
    "",
  );
  original = await firstCompareAt.inputValue();
  expect(original).toBe("");

  await setCompareAt(page, "1");
  await expect(page.getByLabel(`Compare-at price of ${sku}`)).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await setCompareAt(page, "999999");
  await expect(page.getByText(`${sku} saved`)).toBeVisible();

  await page.goto(`/products?q=${encodeURIComponent(name)}&on_sale=true`);
  await expect(
    page.getByRole("row", { name: new RegExp(name) }).getByText("On sale"),
  ).toBeVisible();

  await setCompareAt(page, "");
  await expect(page.getByText(`${sku} saved`)).toBeVisible();

  await page.goto(`/products?q=${encodeURIComponent(name)}`);
  const listed = page.getByRole("row", { name: new RegExp(name) });
  await expect(listed).toBeVisible();
  await expect(listed.getByText("On sale")).toHaveCount(0);
});
