import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3011",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "mobile-iphone13",
      use: {
        ...devices["iPhone 13"],
      },
    },
    {
      name: "mobile-pixel7",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
