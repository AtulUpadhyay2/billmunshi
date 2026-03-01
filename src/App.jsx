import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Dashboard
const Dashboard = lazy(() => import("./pages/dashboard"));

const Landing = lazy(() => import("./pages/Landing"));
const BookDemo = lazy(() => import("./pages/BookDemo"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPass = lazy(() => import("./pages/auth/ForgotPassword"));
const NoOrganization = lazy(() => import("./pages/auth/NoOrganization"));
const SelectOrganization = lazy(() => import("./pages/auth/SelectOrganization"));
const Error = lazy(() => import("./pages/NotFound"));

import Layout from "./layouts/Layout";
import AuthLayout from "./layouts/AuthLayout";

// utility pages
const Profile = lazy(() => import("./pages/utility/Profile"));
const NotificationPage = lazy(() => import("./pages/utility/Notifications"));

// Zoho
const ZohoVendorBill = lazy(() => import("./pages/zoho/vendor-bill"));
const ZohoVendorBillDetail = lazy(() => import("./pages/zoho/vendor-bill/detail"));

const ZohoExpenseBill = lazy(() => import("./pages/zoho/expense-bill"));
const ZohoExpenseBillDetail = lazy(() => import("./pages/zoho/expense-bill/detail"));
const ZohoJournalEntry = lazy(() => import("./pages/zoho/journal-entry"));
const ZohoJournalEntryDetail = lazy(() => import("./pages/zoho/journal-entry/detail"));
const ZohoCredentials = lazy(() => import("./pages/zoho/config/Credentials"));
const ZohoChartOfAccounts = lazy(() => import("./pages/zoho/config/ChartOfAccount"));
const ZohoTaxes = lazy(() => import("./pages/zoho/config/Taxes"));
const ZohoTdsTcs = lazy(() => import("./pages/zoho/config/TdsTcs"));
const ZohoVendors = lazy(() => import("./pages/zoho/config/Vendors"));
const ZohoVendorsCredits = lazy(() => import("./pages/zoho/config/VendorsCredits"));

// Tally
const TallyVendorBill = lazy(() => import("./pages/tally/vendor-bill"));
const TallyVendorBillDetail = lazy(() => import("./pages/tally/vendor-bill/detail"));

const TallyExpenseBill = lazy(() => import("./pages/tally/expense-bill"));
const TallyExpenseBillDetail = lazy(() => import("./pages/tally/expense-bill/detail"));
const TallyLedgers = lazy(() => import("./pages/tally/config/Ledgers"));
const TallySetups = lazy(() => import("./pages/tally/config/Setup"));
const TallyMaster = lazy(() => import("./pages/tally/config/Master"));
const TallyHelp = lazy(() => import("./pages/settings/Help"));

// Settings
const ApiKeys = lazy(() => import("./pages/settings/ApiKeys"));
const Members = lazy(() => import("./pages/settings/Members"));

// Clients
const Clients = lazy(() => import("./pages/client"));

import Loading from "@/components/Loading";

function App() {
  return (
    <main className="App  relative">
      <Routes>
        <Route path="/" element={
          <Suspense fallback={<Loading />}>
            <Landing />
          </Suspense>
        } />
        <Route path="/book-demo" element={
          <Suspense fallback={<Loading />}>
            <BookDemo />
          </Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<Loading />}>
            <TermsAndConditions />
          </Suspense>
        } />
        <Route path="/privacy-policy" element={
          <Suspense fallback={<Loading />}>
            <PrivacyPolicy />
          </Suspense>
        } />
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPass />} />
          <Route path="/auth/no-organization" element={<NoOrganization />} />
          <Route path="/auth/select-organization" element={<SelectOrganization />} />
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
          <Route path="zoho/expense-bill/:id" element={<ZohoExpenseBillDetail />} />
          <Route path="zoho/journal-entry" element={<ZohoJournalEntry />} />
          <Route path="zoho/journal-entry/:id" element={<ZohoJournalEntryDetail />} />
          <Route path="zoho/config/credentials" element={<ZohoCredentials />} />
          <Route path="zoho/chart-of-account" element={<ZohoChartOfAccounts />} />
          <Route path="zoho/taxes" element={<ZohoTaxes />} />
          <Route path="zoho/tds-tcs" element={<ZohoTdsTcs />} />
          <Route path="zoho/vendors" element={<ZohoVendors />} />
          <Route path="zoho/vendors-credits" element={<ZohoVendorsCredits />} />

          {/** Tally */}
          <Route path="tally/vendor-bill" element={<TallyVendorBill />} />
          <Route path="tally/vendor-bill/:id" element={<TallyVendorBillDetail />} />
          <Route path="tally/expense-bill" element={<TallyExpenseBill />} />
          <Route path="tally/expense-bill/:id" element={<TallyExpenseBillDetail />} />
          <Route path="tally/ledgers" element={<TallyLedgers />} />
          <Route path="tally/setup" element={<TallySetups />} />
          <Route path="tally/masters" element={<TallyMaster />} />
          <Route path="tally/help" element={<TallyHelp />} />

          {/** Settings */}
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="members" element={<Members />} />

          {/* Clients */}
          <Route path="clients" element={<Clients />} />

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
