import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

test("an admin writes a chapter and schedules it onto the public release schedule", async ({ page, context }) => {
  await signInAs(context, "admin");
  await page.goto("/admin/novels/the-time-machine");
  await page.getByRole("button", { name: "New chapter" }).click();
  await expect(page).toHaveURL(/\/admin\/novels\/the-time-machine\/chapters\/\d+$/);
  const number = Number(page.url().split("/").pop());

  await page.getByLabel("Chapter title").fill("A Postscript From the Future");
  await expect(page.getByText(/Saved \d/)).toBeVisible();

  await page.getByRole("radio", { name: "Schedule" }).click();
  await page.getByRole("button", { name: "Schedule release" }).click();
  await expect(page.getByText(/Scheduled for/)).toBeVisible();

  await signInAs(context, "guest");
  await page.goto("/schedule");
  await expect(page.getByText(`Chapter ${number}: A Postscript From the Future`)).toBeVisible();
});
