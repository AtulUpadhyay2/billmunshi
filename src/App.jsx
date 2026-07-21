import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Dashboard
const Dashboard = lazy(() => import("./pages/dashboard"));

const Landing = lazy(() => import("./pages/Landing"));
const BookDemo = lazy(() => import("./pages/BookDemo"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register"));
const ForgotPass = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const NoOrganization = lazy(() => import("./pages/auth/NoOrganization"));
const SelectOrganization = lazy(
  () => import("./pages/auth/SelectOrganization"),
);
const Error = lazy(() => import("./pages/NotFound"));

import Layout from "./layouts/Layout";
import AuthLayout from "./layouts/AuthLayout";
import RequireAuth from "./layouts/RequireAuth";

// utility pages
const Profile = lazy(() => import("./pages/utility/profile"));
const NotificationPage = lazy(() => import("./pages/utility/notifications"));

// Zoho
const ZohoVendorBill = lazy(() => import("./pages/zoho/vendor-bill"));
const ZohoVendorBillDetail = lazy(
  () => import("./pages/zoho/vendor-bill/detail"),
);

const ZohoExpenseBill = lazy(() => import("./pages/zoho/expense-bill"));
const ZohoExpenseBillDetail = lazy(
  () => import("./pages/zoho/expense-bill/detail"),
);
const ZohoJournalEntry = lazy(() => import("./pages/zoho/journal-entry"));
const ZohoJournalEntryDetail = lazy(
  () => import("./pages/zoho/journal-entry/detail"),
);
const ZohoCredentials = lazy(() => import("./pages/zoho/config/credentials"));
const ZohoChartOfAccounts = lazy(
  () => import("./pages/zoho/config/ChartOfAccount"),
);
const ZohoTaxes = lazy(() => import("./pages/zoho/config/taxes"));
const ZohoTdsTcs = lazy(() => import("./pages/zoho/config/TdsTcs"));
const ZohoVendors = lazy(() => import("./pages/zoho/config/vendors"));
const ZohoVendorsCredits = lazy(
  () => import("./pages/zoho/config/VendorsCredits"),
);

// Tally
const TallyVendorBill = lazy(() => import("./pages/tally/vendor-bill"));
const TallyVendorBillDetail = lazy(
  () => import("./pages/tally/vendor-bill/detail"),
);

const TallyExpenseBill = lazy(() => import("./pages/tally/expense-bill"));
const TallyExpenseBillDetail = lazy(
  () => import("./pages/tally/expense-bill/detail"),
);
const TallyPaymentVoucher = lazy(() => import("./pages/tally/payment-voucher"));
const TallyPaymentVoucherDetail = lazy(
  () => import("./pages/tally/payment-voucher/detail"),
);
const TallyLedgers = lazy(() => import("./pages/tally/config/ledgers"));
const TallySetups = lazy(() => import("./pages/tally/config/setup"));
const TallyMaster = lazy(() => import("./pages/tally/config/master"));
const TallyAccountInfo = lazy(() => import("./pages/tally/account-info"));

// Settings
const Members = lazy(() => import("./pages/settings/members"));

// Clients
const Clients = lazy(() => import("./pages/client"));

import Loading from "@/components/Loading";

function App() {
  return (
    <main className="App  relative">
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<Loading />}>
              <Landing />
            </Suspense>
          }
        />
        <Route
          path="/book-demo"
          element={
            <Suspense fallback={<Loading />}>
              <BookDemo />
            </Suspense>
          }
        />
        <Route
          path="/terms"
          element={
            <Suspense fallback={<Loading />}>
              <TermsAndConditions />
            </Suspense>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <Suspense fallback={<Loading />}>
              <PrivacyPolicy />
            </Suspense>
          }
        />
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPass />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/no-organization" element={<NoOrganization />} />
          <Route
            path="/auth/select-organization"
            element={<SelectOrganization />}
          />
        </Route>
        <Route element={<RequireAuth />}>
        <Route path="/*" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />

          {/* App pages */}
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<NotificationPage />} />

          {/** Zoho */}
          <Route path="zoho/vendor-bill" element={<ZohoVendorBill />} />
          <Route
            path="zoho/vendor-bill/:id"
            element={<ZohoVendorBillDetail />}
          />
          <Route path="zoho/expense-bill" element={<ZohoExpenseBill />} />
          <Route
            path="zoho/expense-bill/:id"
            element={<ZohoExpenseBillDetail />}
          />
          <Route path="zoho/journal-entry" element={<ZohoJournalEntry />} />
          <Route
            path="zoho/journal-entry/:id"
            element={<ZohoJournalEntryDetail />}
          />
          <Route path="zoho/config/credentials" element={<ZohoCredentials />} />
          <Route
            path="zoho/chart-of-account"
            element={<ZohoChartOfAccounts />}
          />
          <Route path="zoho/taxes" element={<ZohoTaxes />} />
          <Route path="zoho/tds-tcs" element={<ZohoTdsTcs />} />
          <Route path="zoho/vendors" element={<ZohoVendors />} />
          <Route path="zoho/vendors-credits" element={<ZohoVendorsCredits />} />

          {/** Tally */}
          <Route path="tally/vendor-bill" element={<TallyVendorBill />} />
          <Route
            path="tally/vendor-bill/:id"
            element={<TallyVendorBillDetail />}
          />
          <Route path="tally/expense-bill" element={<TallyExpenseBill />} />
          <Route
            path="tally/expense-bill/:id"
            element={<TallyExpenseBillDetail />}
          />
          <Route path="tally/payment-voucher" element={<TallyPaymentVoucher />} />
          <Route
            path="tally/payment-voucher/:id"
            element={<TallyPaymentVoucherDetail />}
          />
          <Route path="tally/ledgers" element={<TallyLedgers />} />
          <Route path="tally/setup" element={<TallySetups />} />
          <Route path="tally/masters" element={<TallyMaster />} />
          <Route path="tally/account-info" element={<TallyAccountInfo />} />

          {/** Settings */}
          <Route path="members" element={<Members />} />

          {/* Clients */}
          <Route path="clients" element={<Clients />} />

          <Route path="*" element={<Navigate to="/404" />} />
        </Route>
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
