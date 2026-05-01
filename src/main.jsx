import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "simplebar-react/dist/simplebar.min.css";
import "../src/assets/css/app.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import "./utils/toast"; // Import global toast utility
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

// Create a QueryClient instance with conservative defaults — avoids
// hammering the backend when the user switches tabs / refocuses the window.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as fresh for 5 minutes — switching tabs and coming back
      // within this window won't trigger a refetch.
      staleTime: 5 * 60 * 1000,
      // Keep cached data for 30 minutes after queries unmount.
      gcTime: 30 * 60 * 1000,
      // Don't refetch the moment a component remounts if data is still fresh.
      refetchOnMount: false,
      // Don't refetch when the user switches back to this tab.
      refetchOnWindowFocus: false,
      // Don't refetch on every network reconnect either.
      refetchOnReconnect: false,
      // One retry on failure is enough; the original default was 3.
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster position="top-right" richColors closeButton />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Provider>
    </BrowserRouter>
  </>
);
