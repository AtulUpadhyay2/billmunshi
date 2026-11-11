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
import { Toaster } from "sonner";
import { CookieConsentProvider } from "./components/cookies";
import MaintenanceGate from "./components/MaintenanceGate";
import { addCollection } from "@iconify/react";
import offlineIcons from "./icons/offline";

// Register every icon the interface uses before React renders one.
//
// `@iconify/react` otherwise fetches icon data from api.iconify.design on
// first use. A cold load of the landing page spent three cross-origin
// requests on it, the icons arrived after the text they belong to, and
// the whole interface quietly depended on a third-party CDN being up.
//
// `scripts/build-icon-bundle.mjs` writes `icons/offline.js` from the names
// the source actually mentions — run `npm run icons` after adding one.
// An icon that is not in the bundle still resolves over the network, so a
// missed name degrades rather than disappears.
offlineIcons.forEach(addCollection);

// Devtools are loaded only in development to keep them out of production
// bundles entirely (Vite tree-shakes the import.meta.env.DEV branch).
const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : null;

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
          {/* Inside the router so the banner can link to the policy
              pages, and above <App /> so every route — public or
              authenticated — is covered by the same consent state. */}
          <CookieConsentProvider>
            {/* Wraps every route. While the backend is in maintenance
                this renders the maintenance screen instead of the app,
                so a client sees one clear message rather than a page
                full of failed requests. Staff are never blocked by the
                backend, so for them it stays invisible. */}
            <MaintenanceGate>
              <App />
            </MaintenanceGate>
            <Toaster position="top-right" richColors closeButton />
            {ReactQueryDevtools && (
              <React.Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} />
              </React.Suspense>
            )}
          </CookieConsentProvider>
        </QueryClientProvider>
      </Provider>
    </BrowserRouter>
  </>
);
