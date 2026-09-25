import { type Page, expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL ?? "";
const password = process.env.E2E_PASSWORD ?? "";

export function requireLiveApi() {
  test.skip(
    !process.env.E2E_API || !email || !password,
    "Needs a live, seeded API: set E2E_API, E2E_EMAIL and E2E_PASSWORD.",
  );
}

export async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}
