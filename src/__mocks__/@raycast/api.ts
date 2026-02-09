import { vi } from "vitest";

export const getPreferenceValues = vi.fn().mockReturnValue({
  serverUrl: "https://coolify.example.com",
  apiToken: "test-token-123",
});
