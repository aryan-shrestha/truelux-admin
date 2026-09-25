import { expect, test } from "@playwright/test";

import { requireLiveApi, signIn } from "@/tests/e2e/session";

requireLiveApi();

test("an anonymous visit is sent to sign in and returns to where it was going", async ({ page }) => {
  await page.goto("/orders?status=pending");
  await expect(page).toHaveURL(/\/login\?next=%2Forders%3Fstatus%3Dpending/);
});

test("staff sign in, work the order queue and sign out", async ({ page, context }) => {
  await signIn(page);

  const cookies = await context.cookies();
  for (const name of ["tl_access", "tl_refresh"]) {
    expect(cookies.find((cookie) => cookie.name === name)).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  }

  await page.getByRole("link", { name: "Orders" }).first().click();
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

  await page.getByRole("tab", { name: "Pending" }).click();
  await expect(page).toHaveURL(/status=pending/);

  const firstOrder = page.getByRole("row").nth(1).getByRole("link");
  if ((await firstOrder.count()) > 0) {
    const number = await firstOrder.innerText();
    await firstOrder.click();
    await expect(page.getByRole("heading", { name: number })).toBeVisible();
    await expect(page.getByText("Total, collected on delivery")).toBeVisible();
  }

  await page.getByRole("button", { name: /@/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.cookies()).some((cookie) => cookie.name === "tl_refresh")).toBe(false);
});

test("a wrong password is refused without naming the field", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@truelux.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});
