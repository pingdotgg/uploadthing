import path from "path";
import { expect, test } from "@playwright/test";

const dirname = new URL(".", import.meta.url).pathname;
const testFile = (name: string) => path.join(dirname, "test-files", name);

test("uploads a single image", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("text=Hello from Hono!");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("label").filter({ hasText: "Choose File(s)" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testFile("small-file.png"));
  await page.waitForEvent("dialog", {
    predicate: (d) => d.message() === "Upload complete",
  });
});

test("limits file size", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForSelector("text=Hello from Hono!");

  const loggedErrors: string[] = [];
  context.on("console", (msg) => {
    if (msg.type() === "error") {
      loggedErrors.push(msg.text());
    }
  });

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("label").filter({ hasText: "Choose File(s)" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testFile("big-file.jpg"));
  await page.waitForEvent("dialog", {
    predicate: (d) => d.message() === "Upload failed",
  });
  expect(loggedErrors).toContainEqual(
    expect.stringContaining("Invalid config: FileSizeMismatch"),
  );
});

test("limits number of files", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForSelector("text=Hello from Hono!");

  const loggedErrors: string[] = [];
  context.on("console", (msg) => {
    if (msg.type() === "error") {
      loggedErrors.push(msg.text());
    }
  });

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("label").filter({ hasText: "Choose File(s)" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles([
    testFile("small-file.png"),
    testFile("small-file.png"),
    testFile("small-file.png"),
    testFile("small-file.png"),
    testFile("small-file.png"),
    testFile("small-file.png"),
  ]);
  await page.waitForEvent("dialog", {
    predicate: (d) => d.message() === "Upload failed",
  });
  expect(loggedErrors).toContainEqual(
    expect.stringContaining("Invalid config: FileCountMismatch"),
  );
});
