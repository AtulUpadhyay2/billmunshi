import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// home pages  & dashboard
//import Dashboard from "./pages/dashboard";
const Dashboard = lazy(() => import("./pages/dashboard"));

const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register"));
const ForgotPass = lazy(() => import("./pages/auth/forgot-password"));
const NoOrganization = lazy(() => import("./pages/auth/no-organization"));
const Error = lazy(() => import("./pages/404"));

import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";

// utility pages
const Profile = lazy(() => import("./pages/utility/profile"));
const NotificationPage = lazy(() => import("./pages/utility/notifications"));

// Zoho
const ZohoVendorBill = lazy(() => import("./pages/zoho/vendor-bill"));
const ZohoVendorBillDetail = lazy(() => import("./pages/zoho/vendor-bill/detail"));

const ZohoExpenseBill = lazy(() => import("./pages/zoho/expense-bill"));
const ZohoCredentials = lazy(() => import("./pages/zoho/config/credentials"));
const ZohoChartOfAccounts = lazy(() => import("./pages/zoho/config/chart-of-account"));
const ZohoTaxes = lazy(() => import("./pages/zoho/config/taxes"));
const ZohoTdsTcs = lazy(() => import("./pages/zoho/config/tds-tcs"));
const ZohoVendors = lazy(() => import("./pages/zoho/config/vendors"));
const ZohoVendorsCredits = lazy(() => import("./pages/zoho/config/vendors-credits"));

// Tally
const TallyVendorBill = lazy(() => import("./pages/tally/vendor-bill"));
const TallyVendorBillDetail = lazy(() => import("./pages/tally/vendor-bill/detail"));

const TallyExpenseBill = lazy(() => import("./pages/tally/expense-bill"));
const TallyLedgers = lazy(() => import("./pages/tally/config/ledgers"));
const TallySetups = lazy(() => import("./pages/tally/config/setup"));

// Settings
const ApiKeys = lazy(() => import("./pages/settings/api-keys"));
const Members = lazy(() => import("./pages/settings/members"));

import Loading from "@/components/Loading";

function App() {
  return (
    <main className="App  relative">
      <Routes>
        <Route path="/" element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPass />} />
          <Route path="/no-organization" element={<NoOrganization />} />
        </Route>
        <Route path="/*" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />

          {/* App pages */}
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<NotificationPage />} />

          {/** Zoho */}
          <Route path="zoho/vendor-bill" element={<ZohoVendorBill />} />
          <Route path="zoho/vendor-bill/:id" element={<ZohoVendorBillDetail />} />
          <Route path="zoho/expense-bill" element={<ZohoExpenseBill />} />
          <Route path="zoho/credentials" element={<ZohoCredentials />} />
          <Route path="zoho/chart-of-account" element={<ZohoChartOfAccounts />} />
          <Route path="zoho/taxes" element={<ZohoTaxes />} />
          <Route path="zoho/tds-tcs" element={<ZohoTdsTcs />} />
          <Route path="zoho/vendors" element={<ZohoVendors />} />
          <Route path="zoho/vendors-credits" element={<ZohoVendorsCredits />} />

          {/** Tally */}
          <Route path="tally/vendor-bill" element={<TallyVendorBill />} />
          <Route path="tally/vendor-bill/:id" element={<TallyVendorBillDetail />} />
          <Route path="tally/expense-bill" element={<TallyExpenseBill />} />
          <Route path="tally/ledgers" element={<TallyLedgers />} />
          <Route path="tally/setup" element={<TallySetups />} />

          {/** Settings */}
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="members" element={<Members />} />

          <Route path="*" element={<Navigate to="/404" />} />
        </Route>
        <Route
          path="/404"
          element={
            <Suspense fallback={<Loading />}>
              <Error />
            </Suspense>
          }
        />
      </Routes>
    </main>
  );
}

export default App;
