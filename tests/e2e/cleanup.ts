import { type Page, expect } from "@playwright/test";

export async function deleteListed(
  page: Page,
  { path, name, confirm }: { path: string; name: string; confirm: string },
) {
  await page.goto(`${path}?q=${encodeURIComponent(name)}`);
  const menu = page.getByRole("button", { name: `Actions for ${name}`, exact: true });
  if ((await menu.count()) === 0) return;
  await menu.click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: confirm, exact: true }).click();
  await expect(page.getByText(`${name} deleted`)).toBeVisible();
}
