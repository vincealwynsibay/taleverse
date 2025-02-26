import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

// Seed: Dracula has 27 chapters. 1–22 are free, 23–25 early access, 26–27 scheduled.
test.describe.configure({ mode: "serial" });

test("a guest can read free chapters but only sees a preview of early access", async ({ page, context }) => {
  await signInAs(context, "guest");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Trending" })).toBeVisible();

  await page.goto("/novels/dracula");
  await page.getByRole("link", { name: "Start reading" }).click();
  await expect(page).toHaveURL(/\/novels\/dracula\/1$/);
  await expect(page.getByRole("heading", { name: "Jonathan Harker’s Journal" })).toBeVisible();
  expect(await page.locator("#chapter-body p").count()).toBeGreaterThan(20);

  await page.goto("/novels/dracula/25");
  await expect(page.getByText("This chapter is in early access")).toBeVisible();
  expect(await page.locator("#chapter-body p").count()).toBeLessThanOrEqual(4);

  // Scheduled chapters don't exist for readers yet.
  const res = await page.goto("/novels/dracula/27");
  expect(res?.status()).toBe(404);
});

test("a reader unlocks an early-access chapter with credits", async ({ page, context }) => {
  await signInAs(context, "reader");
  await page.goto("/novels/dracula/24");
  const unlock = page.getByRole("button", { name: "Unlock for 5 credits" });
  await expect(unlock).toBeVisible();
  await expect(page.getByText("You have 25 credits")).toBeVisible();
  await unlock.click();

  await expect(page.getByText("This chapter is in early access")).toBeHidden();
  await expect.poll(() => page.locator("#chapter-body p").count()).toBeGreaterThan(10);

  await page.goto("/credits");
  await expect(page.getByText("Unlocked Dracula · Chapter 24")).toBeVisible();
  await expect(page.getByLabel("20 credits")).toBeVisible();
});

test("a reader buys a credit pack", async ({ page, context }) => {
  await signInAs(context, "reader");
  await page.goto("/credits");
  await page.getByRole("button", { name: "Buy for $4.99" }).click();
  await expect(page).toHaveURL(/purchase=success/);
  await expect(page.getByText("Payment received, credits added.")).toBeVisible();
  await expect(page.getByLabel("80 credits")).toBeVisible();
});

test("a reader builds a library, reviews and comments", async ({ page, context }) => {
  await signInAs(context, "reader");

  await page.goto("/novels/frankenstein");
  await page.getByRole("button", { name: "Add to library" }).click();
  await expect(page.getByRole("button", { name: "In library" })).toBeVisible();

  await page.getByRole("radio", { name: "4 stars" }).click();
  await page.getByLabel("Your review").fill("Unsettling and sad in the best way. The letters frame it perfectly.");
  await page.getByRole("button", { name: "Post review" }).click();
  await expect(page.getByText("You rated this")).toBeVisible();

  await page.goto("/library");
  await expect(page.getByRole("link", { name: "Frankenstein; or, The Modern Prometheus", exact: true })).toBeVisible();

  await page.goto("/novels/frankenstein/1");
  await page.getByLabel("Write a comment").fill("Walton's letters are such a good way in.");
  await page.getByRole("button", { name: "Post comment" }).click();
  await expect(page.getByText("Walton's letters are such a good way in.")).toBeVisible();
});

test("readers can't see the admin area", async ({ page, context }) => {
  await signInAs(context, "reader");
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});
