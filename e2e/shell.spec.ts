import { expect, test } from "@playwright/test";

test("the dashboard renders inside the sidebar shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("the BFF is reachable through the dev proxy", async ({ request }) => {
  const response = await request.get("/bff/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
