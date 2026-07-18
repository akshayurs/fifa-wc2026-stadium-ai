import { expect, test } from "@playwright/test";

test.describe("Stadium Pulse", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the command center and fan assistant", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Stadium Pulse", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /operations command center/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /fan assistant/i }),
    ).toBeVisible();
  });

  test("streams a fan assistant answer", async ({ page }) => {
    await page
      .getByLabel(/your question/i)
      .fill("Where is the nearest step-free entrance?");
    await page.getByRole("button", { name: "Ask" }).click();

    await expect(page.getByText(/step-free entrance/i)).toBeVisible();
  });

  test("generates an operations briefing", async ({ page }) => {
    await page.getByRole("button", { name: /generate briefing/i }).click();

    await expect(page.getByText(/concourse signage/i)).toBeVisible();
  });

  test("exposes a skip link to keyboard users", async ({ page }) => {
    await page.keyboard.press("Tab");

    await expect(
      page.getByRole("link", { name: /skip to main content/i }),
    ).toBeFocused();
  });
});
