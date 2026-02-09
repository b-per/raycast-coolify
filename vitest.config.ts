import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    alias: {
      "@raycast/api": new URL("./src/__mocks__/@raycast/api.ts", import.meta.url).pathname,
      "@raycast/utils": new URL("./src/__mocks__/@raycast/utils.ts", import.meta.url).pathname,
    },
  },
});
