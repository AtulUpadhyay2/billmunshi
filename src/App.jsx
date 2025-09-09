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

// chart page
const AppexChartPage = lazy(() => import("./pages/chart/appex-chart"));
const ChartJs = lazy(() => import("./pages/chart/chartjs"));
const Recharts = lazy(() => import("./pages/chart/recharts"));

// map page
const MapPage = lazy(() => import("./pages/map"));

// table pages
const BasicTablePage = lazy(() => import("./pages/table/table-basic"));
const TanstackTable = lazy(() => import("./pages/table/react-table"));

// utility pages
const InvoicePage = lazy(() => import("./pages/utility/invoice"));
const InvoiceAddPage = lazy(() => import("./pages/utility/invoice-add"));
const InvoicePreviewPage = lazy(() => import("./pages/utility/invoice-preview"));
const InvoiceEditPage = lazy(() => import("./pages/utility/invoice-edit"));
const PricingPage = lazy(() => import("./pages/utility/pricing"));
const BlankPage = lazy(() => import("./pages/utility/blank-page"));
const ComingSoonPage = lazy(() => import("./pages/utility/coming-soon"));
const UnderConstructionPage = lazy(() =>
  import("./pages/utility/under-construction")
);
const BlogPage = lazy(() => import("./pages/utility/blog"));
const BlogDetailsPage = lazy(() => import("./pages/utility/blog/blog-details"));
const FaqPage = lazy(() => import("./pages/utility/faq"));
const Settings = lazy(() => import("./pages/utility/settings"));
const Profile = lazy(() => import("./pages/utility/profile"));
const IconPage = lazy(() => import("./pages/icons"));
const NotificationPage = lazy(() => import("./pages/utility/notifications"));
const ChangelogPage = lazy(() => import("./pages/changelog"));

// widget pages
const BasicWidget = lazy(() => import("./pages/widget/basic-widget"));
const StatisticWidget = lazy(() => import("./pages/widget/statistic-widget"));

const KanbanPage = lazy(() => import("./pages/app/kanban"));
const CalenderPage = lazy(() => import("./pages/app/calendar"));


const EcommercePage = lazy(() => import("./pages/ecommerce"));

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
const TallyExpenseBill = lazy(() => import("./pages/tally/expense-bill"));

// Settings
const ApiKeys = lazy(() => import("./pages/settings/api-keys"));
const Members = lazy(() => import("./pages/settings/members"));

// Test pages
const ModulesTestPage = lazy(() => import("./pages/modules-test"));

import Loading from "@/components/Loading";
import { ProductDetails } from "./pages/ecommerce/productDetails";
import Cart from "./pages/ecommerce/cart";
import Wishlist from "./pages/ecommerce/wish-list";
import Orders from "./pages/ecommerce/orders";
import OrderDetails from "./pages/ecommerce/orderDetails";
import Checkout from "./pages/ecommerce/checkout";
import EditProduct from "./pages/ecommerce/edit-product";
import Customers from "./pages/ecommerce/customers";
import Sellers from "./pages/ecommerce/sellers";
import AddProduct from "./pages/ecommerce/add-product";
import InvoiceEPage from "./pages/ecommerce/invoice-ecompage";

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
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="calender" element={<CalenderPage />} />


          <Route path="appex-chart" element={<AppexChartPage />} />
          <Route path="chartjs" element={<ChartJs />} />
          <Route path="recharts" element={<Recharts />} />
          <Route path="map" element={<MapPage />} />
          <Route path="table-basic" element={<BasicTablePage />} />
          <Route path="react-table" element={<TanstackTable />} />
          <Route path="invoice" element={<InvoicePage />} />
          <Route path="invoice-add" element={<InvoiceAddPage />} />
          <Route path="invoice-preview" element={<InvoicePreviewPage />} />
          <Route path="invoice-edit" element={<InvoiceEditPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="blank-page" element={<BlankPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog-details" element={<BlogDetailsPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="basic" element={<BasicWidget />} />
          <Route path="statistic" element={<StatisticWidget />} />
          <Route path="icons" element={<IconPage />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="changelog" element={<ChangelogPage />} />

          <Route path="products" element={<EcommercePage />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="orders" element={<Orders />} />
          <Route path="order-details" element={<OrderDetails />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="edit-product" element={<EditProduct />} />
          <Route path="customers" element={<Customers />} />
          <Route path="sellers" element={<Sellers />} />
          <Route path="invoice-ecommerce" element={<InvoiceEPage />} />

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
          <Route path="tally/expense-bill" element={<TallyExpenseBill />} />

          {/** Settings */}
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="members" element={<Members />} />

          {/* Test pages */}
          <Route path="modules-test" element={<ModulesTestPage />} />

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
        <Route
          path="/coming-soon"
          element={
            <Suspense fallback={<Loading />}>
              <ComingSoonPage />
            </Suspense>
          }
        />
        <Route
          path="/under-construction"
          element={
            <Suspense fallback={<Loading />}>
              <UnderConstructionPage />
            </Suspense>
          }
        />
      </Routes>
    </main>
  );
}

export default App;
