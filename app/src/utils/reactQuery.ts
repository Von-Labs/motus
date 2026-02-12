import { QueryClient } from '@tanstack/react-query'

// Shared React Query client for the entire app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tune these defaults as needed for the app
      retry: 2,
      staleTime: 1000 * 60, // 1 minute
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

