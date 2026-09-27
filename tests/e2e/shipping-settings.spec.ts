import { type Page, expect, test } from "@playwright/test";

import { requireLiveApi, signIn } from "@/tests/e2e/session";

requireLiveApi();

const PATH = "/settings/shipping";

type Snapshot = { inside: string; outside: string; threshold: string | null };

let original: Snapshot | null = null;

async function read(page: Page): Promise<Snapshot> {
  const on = await page.getByRole("switch", { name: "Free shipping" }).isChecked();
  return {
    inside: await page.getByLabel("Inside Kathmandu valley").inputValue(),
    outside: await page.getByLabel("Outside the valley").inputValue(),
    threshold: on ? await page.getByLabel("Free shipping threshold").inputValue() : null,
  };
}

async function setFreeShipping(page: Page, on: boolean) {
  const toggle = page.getByRole("switch", { name: "Free shipping" });
  if ((await toggle.isChecked()) !== on) await toggle.click();
}

async function save(page: Page) {
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Shipping settings saved")).toBeVisible();
}

test.afterAll(async ({ browser }) => {
  if (!original) return;
  const page = await browser.newPage();
  await signIn(page);
  await page.goto(PATH);
  await page.getByLabel("Inside Kathmandu valley").fill(original.inside);
  await page.getByLabel("Outside the valley").fill(original.outside);
  await setFreeShipping(page, original.threshold !== null);
  if (original.threshold !== null) {
    await page.getByLabel("Free shipping threshold").fill(original.threshold);
  }
  await save(page);
  await page.close();
});

test("change the free-shipping threshold, reload, and see it kept", async ({ page }) => {
  await signIn(page);

  await page.getByRole("link", { name: "Shipping" }).click();
  await expect(page.getByRole("heading", { name: "Shipping" })).toBeVisible();
  original = await read(page);

  const threshold = original.threshold === "9876.50" ? "9123.00" : "9876.50";
  await setFreeShipping(page, true);
  await page.getByLabel("Free shipping threshold").fill(threshold);
  await save(page);

  await page.reload();
  await expect(page.getByRole("switch", { name: "Free shipping" })).toBeChecked();
  await expect(page.getByLabel("Free shipping threshold")).toHaveValue(threshold);

  await setFreeShipping(page, false);
  await save(page);
  await page.reload();
  await expect(page.getByRole("switch", { name: "Free shipping" })).not.toBeChecked();
  await expect(page.getByLabel("Free shipping threshold")).toHaveCount(0);

  await page.getByLabel("Inside Kathmandu valley").fill("-5");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Enter an amount like 150 or 150.50.")).toBeVisible();
});
