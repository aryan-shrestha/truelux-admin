import { expect, test } from "@playwright/test";

import { deleteListed } from "@/tests/e2e/cleanup";
import { requireLiveApi, signIn } from "@/tests/e2e/session";

requireLiveApi();

const name = `E2E Skin ${Date.now()}`;

test.afterAll(async ({ browser }) => {
  await deleteListed(browser, { path: "/skin-types", prefix: name, confirm: "Delete" });
});

test("create, rename and delete a skin type", async ({ page }) => {
  await signIn(page);

  await page.getByRole("link", { name: "Skin types" }).click();
  await expect(page.getByRole("heading", { name: "Skin types" })).toBeVisible();

  await page.getByRole("button", { name: "New skin type" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create skin type" }).click();
  await expect(page.getByText("Skin type created")).toBeVisible();

  await page.getByLabel("Search skin types").fill(name);
  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByLabel("Name").fill(`${name} renamed`);
  await page.getByRole("button", { name: "Save skin type" }).click();
  await expect(page.getByText("Skin type saved")).toBeVisible();

  await page.getByRole("button", { name: `Actions for ${name} renamed` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("This cannot be undone.");
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(`${name} renamed deleted`)).toBeVisible();
  await expect(page.getByText(`No skin types match “${name}”`)).toBeVisible();
});
