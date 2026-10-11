import { expect, test } from "@playwright/test";

// Runs against the live API (`make run` in ../back-end, with this origin in
// DJANGO_CORS_ALLOWED_ORIGINS) and a staff account such as `make seed-staff` creates.
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD;

test.skip(
  STAFF_EMAIL === undefined || STAFF_PASSWORD === undefined,
  "Set E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD to sign in against the running API.",
);

test("staff sign in, reach the dashboard and sign out", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(STAFF_EMAIL ?? "");
  await page.getByLabel("Password").fill(STAFF_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("button", { name: STAFF_EMAIL }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("truelux-admin-session"))).toBeNull();
});

test("a wrong password is refused with one message", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(STAFF_EMAIL ?? "");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});
