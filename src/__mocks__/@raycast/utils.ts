import { vi } from "vitest";

export const useFetch = vi.fn().mockReturnValue({
  data: undefined,
  isLoading: true,
  error: undefined,
  revalidate: vi.fn(),
});
