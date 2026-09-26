import { type Browser, expect } from "@playwright/test";

import { signIn } from "@/tests/e2e/session";

export async function deleteListed(
  browser: Browser,
  { path, prefix, confirm }: { path: string; prefix: string; confirm: string },
) {
  const page = await browser.newPage();
  await signIn(page);
  await page.goto(`${path}?q=${encodeURIComponent(prefix)}`);
  const menus = page.getByRole("button", { name: `Actions for ${prefix}` });
  for (let left = await menus.count(); left > 0; left--) {
    await menus.first().click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { name: confirm, exact: true }).click();
    await expect(menus).toHaveCount(left - 1);
  }
  await page.close();
}
