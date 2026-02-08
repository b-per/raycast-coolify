export const useFetch = jest.fn().mockReturnValue({
  data: undefined,
  isLoading: true,
  error: undefined,
  revalidate: jest.fn(),
});
