import { expect, test } from "@playwright/test";

// Runs against the live API (see e2e/auth.spec.ts for the setup). It changes the
// shipping settings and restores the original values at the end.
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

test.skip(
  STAFF_EMAIL === undefined || STAFF_PASSWORD === undefined,
  "Set E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD to change shipping settings on the running API.",
);

test("a changed free-shipping threshold is kept after a reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(STAFF_EMAIL ?? "");
  await page.getByLabel("Password").fill(STAFF_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/settings/shipping");
  const toggle = page.getByRole("switch", { name: "Free shipping" });
  await expect(toggle).toBeVisible();
  const wasOn = (await toggle.getAttribute("aria-checked")) === "true";
  const threshold = page.getByLabel("Free shipping from");
  const original = wasOn ? await threshold.inputValue() : "";

  if (!wasOn) await toggle.click();
  await threshold.fill("4321");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Shipping settings saved")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Free shipping from")).toHaveValue("4321.00");

  if (wasOn) await page.getByLabel("Free shipping from").fill(original);
  else await page.getByRole("switch", { name: "Free shipping" }).click();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Shipping settings saved")).toBeVisible();
});
