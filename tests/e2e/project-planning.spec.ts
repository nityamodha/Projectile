import { expect, test } from "@playwright/test";

test.skip(
  !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "Supabase configuration is required for the persistent project-planning workflow."
);

test("creates a project, schedules dependent tasks, renders Gantt, and persists after reload", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /create project/i }).click();
  await page.getByRole("link", { name: /open project/i }).first().click();

  await page.getByRole("button", { name: /add task/i }).click();
  await page.getByDisplayValue("New Task").fill("Task A");
  await page.getByRole("button", { name: /add task/i }).click();
  await page.getByDisplayValue("New Task").fill("Task B");

  const durationInputs = page.locator('input[type="number"]').filter({ hasNotText: "" });
  await durationInputs.nth(0).fill("3");
  await durationInputs.nth(2).fill("2");

  const predecessorInputs = page.locator('input:not([type]), input[type="text"]').filter({ hasText: "" });
  await predecessorInputs.last().fill("1");

  await expect(page.getByText("Task A")).toBeVisible();
  await expect(page.getByText("Task B")).toBeVisible();
  await expect(page.locator("button[title='Task A']")).toBeVisible();
  await expect(page.locator("button[title='Task B']")).toBeVisible();

  await page.reload();
  await expect(page.getByDisplayValue("Task A")).toBeVisible();
  await expect(page.getByDisplayValue("Task B")).toBeVisible();
});
