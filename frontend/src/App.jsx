import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import AppRouter from "@/routes/AppRouter";

/**
 * QueryClient Configuration
 * Global defaults for all queries and mutations
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,              // Retry failed queries once
            staleTime: 1000 * 60,  // 1 minute default stale time
            refetchOnWindowFocus: false, // Don't refetch on tab switch (your choice)
        },
        mutations: {
            retry: 0, // Don't retry mutations by default
        },
    },
});

/**
 * App
 *
 * Root component. Sets up:
 * - BrowserRouter for React Router
 * - QueryClientProvider for TanStack Query
 * - Toaster for react-hot-toast notifications
 */
const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AppRouter />

                {/* Global Toast Notifications */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            fontSize: "14px",
                            fontFamily: "Inter, sans-serif",
                            borderRadius: "10px",
                            padding: "12px 16px",
                        },
                        success: {
                            iconTheme: { primary: "#6366f1", secondary: "#fff" },
                        },
                        error: {
                            iconTheme: { primary: "#ef4444", secondary: "#fff" },
                        },
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    );
};

export default App;
