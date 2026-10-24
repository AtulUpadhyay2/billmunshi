export const menuItems = [
  {
    isHeadr: true,
    title: "menu",
  },

  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    isHide: true,
    link: "/dashboard",
  },
  // Approvals and Activity cover Tally AND Zoho — the queue and the log
  // are keyed on the organisation, not on a module. Under the "Tally"
  // heading they read as a Tally feature, which is why they sit here
  // with Dashboard instead: views across everything, before the two
  // accounting packages. (Trash stays under Tally — it genuinely only
  // holds Tally vouchers.)
  {
    title: "Approvals",
    isHide: true,
    icon: "heroicons-outline:badge-check",
    link: "/approvals",
  },

  {
    title: "Activity",
    isHide: true,
    icon: "heroicons-outline:clock",
    link: "/activity",
  },

  {
    isHeadr: true,
    title: "Zoho",
  },

  // Grouped by accounting cycle, exactly as the Tally section below.
  // Purchase is the payables cycle — the vendor bill, the payment that
  // settles it, and the expense, which posts against a vendor and an
  // expense ledger too. Sales is the receivables one. Journal Entry stays
  // top level on purpose: journals arise on both sides (TDS, RCM,
  // provisions on one; write-offs, TCS on the other), so it belongs to
  // neither group.
  {
    title: "Purchase",
    isHide: true,
    icon: "heroicons-outline:shopping-cart",
    link: "#",
    child: [
      {
        childtitle: "Vendor Bill",
        childlink: "/zoho/vendor-bill",
      },
      {
        childtitle: "Payment",
        childlink: "/zoho/payment-voucher",
      },
      {
        childtitle: "Expense Bill",
        childlink: "/zoho/expense-bill",
      },
    ],
  },

  {
    title: "Sales",
    isHide: true,
    icon: "heroicons-outline:currency-rupee",
    link: "#",
    child: [
      {
        childtitle: "Sales",
        childlink: "/zoho/sales-bill",
      },
      {
        childtitle: "Receipt",
        childlink: "/zoho/receipt-voucher",
      },
    ],
  },

  {
    title: "Journal Entry",
    isHide: true,
    icon: "heroicons-outline:document",
    link: "/zoho/journal-entry",
  },
  {
    title: "Config",
    icon: "heroicons-outline:cog",
    link: "#",
    isHide: true,
    child: [
      {
        childtitle: "Credentials",
        childlink: "/zoho/config/credentials",
      },
      {
        childtitle: "Chart of account",
        childlink: "/zoho/chart-of-account",
      },
      {
        childtitle: "GST ledgers",
        childlink: "/zoho/taxes",
      },
      {
        childtitle: "TDS / TCS",
        childlink: "/zoho/tds-tcs",
      },
      {
        childtitle: "Vendor List",
        childlink: "/zoho/vendors",
      },
      {
        childtitle: "Customer List",
        childlink: "/zoho/customers",
      },
      // {
      //   childtitle: "Vendors Credits",
      //   childlink: "zoho/vendors-credits",
      // }
    ],
  },

  {
    isHeadr: true,
    title: "Tally",
  },

  // Vouchers are grouped by accounting cycle. Purchase and Payment are the
  // payables cycle; Sales and Receipt are the receivables one. Journal
  // Entry stays top level on purpose: journals arise on both
  // sides (TDS, RCM, provisions on one; write-offs, TCS on the other), so
  // it belongs to neither group.
  {
    title: "Purchase",
    isHide: true,
    icon: "heroicons-outline:shopping-cart",
    link: "#",
    child: [
      {
        childtitle: "Purchase Voucher",
        childlink: "/tally/vendor-bill",
      },
      {
        childtitle: "Payment Voucher",
        childlink: "/tally/payment-voucher",
      },
    ],
  },

  {
    title: "Sales",
    isHide: true,
    icon: "heroicons-outline:currency-rupee",
    link: "#",
    child: [
      {
        childtitle: "Sales Voucher",
        childlink: "/tally/sales-bill",
      },
      {
        childtitle: "Receipt Voucher",
        childlink: "/tally/receipt-voucher",
      },
    ],
  },

  {
    title: "Journal Entry",
    isHide: true,
    icon: "heroicons-outline:clipboard",
    link: "/tally/expense-bill",
  },


  {
    title: "Trash",
    isHide: true,
    icon: "heroicons-outline:trash",
    link: "/tally/trash",
  },

  {
    title: "Settings",
    icon: "heroicons-outline:cog",
    link: "#",
    isHide: true,
    child: [
      {
        childtitle: "Account Info",
        childlink: "/tally/account-info",
      },
      {
        childtitle: "Tally Integration",
        childlink: "/tally/setup",
      },
      {
        childtitle: "Chart of Accounts",
        childlink: "/tally/ledgers",
      },
      {
        childtitle: "Inventory Items",
        childlink: "/tally/masters",
      },
    ],
  },

  // {
  //   title: "Help",
  //   isHide: true,
  //   icon: "heroicons-outline:question-mark-circle",
  //   link: "/tally/help",
  // },

  {
    isHeadr: true,
    title: "Settings",
  },

  // Admin-only, and an internal measure of how the reader is performing
  // rather than something an operator uses — so it belongs with the
  // other settings, not in the daily workflow.
  {
    title: "Accuracy",
    isHide: true,
    icon: "heroicons-outline:chart-bar",
    link: "/accuracy",
  },
  {
    title: "Members",
    isHide: true,
    icon: "heroicons-outline:users",
    link: "/members",
  },
  {
    title: "Clients",
    isHide: true,
    icon: "heroicons-outline:user-group",
    link: "/clients",
  },
  {
    title: "Support",
    icon: "heroicons-outline:chat-bubble-left-right",
    link: "/support/tickets",
  },
];

export const topMenu = [
  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "/dashboard",
  },
  {
    title: "Zoho",
    icon: "heroicons-outline:building-office",
    link: "#",
    child: [
      {
        childtitle: "Vendor Bill",
        childlink: "/zoho/vendor-bill",
        childicon: "heroicons-outline:document-text",
      },
      {
        childtitle: "Journal Entry",
        childlink: "/zoho/journal-entry",
        childicon: "heroicons-outline:document",
      },
      {
        childtitle: "Expense Bill",
        childlink: "/zoho/expense-bill",
        childicon: "heroicons-outline:clipboard",
      },
      {
        childtitle: "Sales",
        childlink: "/zoho/sales-bill",
        childicon: "heroicons-outline:currency-rupee",
      },
      {
        childtitle: "Receipt",
        childlink: "/zoho/receipt-voucher",
        childicon: "heroicons-outline:banknotes",
      },
      {
        childtitle: "Payment",
        childlink: "/zoho/payment-voucher",
        childicon: "heroicons-outline:credit-card",
      },
      {
        childtitle: "Credentials",
        childlink: "/zoho/config/credentials",
        childicon: "heroicons-outline:key",
      },
      {
        childtitle: "Chart of account",
        childlink: "/zoho/chart-of-account",
        childicon: "heroicons-outline:chart-bar",
      },
      {
        childtitle: "GST ledgers",
        childlink: "/zoho/taxes",
        childicon: "heroicons-outline:calculator",
      },
      {
        childtitle: "TDS / TCS",
        childlink: "/zoho/tds-tcs",
        childicon: "heroicons-outline:receipt-tax",
      },
      {
        childtitle: "Vendor List",
        childlink: "/zoho/vendors",
        childicon: "heroicons-outline:user-group",
      },
      {
        childtitle: "Customer List",
        childlink: "/zoho/customers",
        childicon: "heroicons-outline:users",
      },
    ],
  },
  {
    title: "Tally",
    icon: "heroicons-outline:calculator",
    link: "#",
    child: [
      {
        childtitle: "Purchase Voucher",
        childlink: "/tally/vendor-bill",
        childicon: "heroicons-outline:document-text",
      },
      {
        childtitle: "Journal Entry",
        childlink: "/tally/expense-bill",
        childicon: "heroicons-outline:clipboard",
      },
      {
        childtitle: "Payment Voucher",
        childlink: "/tally/payment-voucher",
        childicon: "heroicons-outline:credit-card",
      },
      {
        childtitle: "Account Info",
        childlink: "/tally/account-info",
        childicon: "heroicons-outline:key",
      },
      {
        childtitle: "Tally Integration",
        childlink: "/tally/setup",
        childicon: "heroicons-outline:cog",
      },
      {
        childtitle: "Chart of Accounts",
        childlink: "/tally/ledgers",
        childicon: "heroicons-outline:book-open",
      },
      {
        childtitle: "Inventory Items",
        childlink: "/tally/masters",
        childicon: "heroicons-outline:academic-cap",
      },
    ],
  },
  {
    title: "Settings",
    icon: "heroicons-outline:cog",
    link: "#",
    child: [
      {
        childtitle: "Members",
        childlink: "/members",
        childicon: "heroicons-outline:users",
      },
      {
        childtitle: "Clients",
        childlink: "/clients",
        childicon: "heroicons-outline:user-group",
      },
    ],
  },
];

import User1 from "@/assets/images/all-img/user.png";
import User2 from "@/assets/images/all-img/user2.png";
import User3 from "@/assets/images/all-img/user3.png";
import User4 from "@/assets/images/all-img/user4.png";
export const notifications = [
  {
    title: "Your order is placed",
    desc: "Amet minim mollit non deser unt ullamco est sit aliqua.",

    image: User1,
    link: "#",
  },
  {
    title: "Congratulations Darlene  🎉",
    desc: "Won the monthly best seller badge",
    unread: true,
    image: User2,
    link: "#",
  },
  {
    title: "Revised Order 👋",
    desc: "Won the monthly best seller badge",

    image: User3,
    link: "#",
  },
  {
    title: "Brooklyn Simmons",
    desc: "Added you to Top Secret Project group...",

    image: User4,
    link: "#",
  },
];

export const message = [
  {
    title: "Wade Warren",
    desc: "Hi! How are you doing?.....",
    active: true,
    hasnotifaction: true,
    notification_count: 1,
    image: User1,
    link: "#",
  },
  {
    title: "Savannah Nguyen",
    desc: "Hi! How are you doing?.....",
    active: false,
    hasnotifaction: false,
    image: User2,
    link: "#",
  },
  {
    title: "Ralph Edwards",
    desc: "Hi! How are you doing?.....",
    active: false,
    hasnotifaction: true,
    notification_count: 8,
    image: User3,
    link: "#",
  },
  {
    title: "Cody Fisher",
    desc: "Hi! How are you doing?.....",
    active: true,
    hasnotifaction: false,
    image: User4,
    link: "#",
  },
  {
    title: "Savannah Nguyen",
    desc: "Hi! How are you doing?.....",
    active: false,
    hasnotifaction: false,
    image: User2,
    link: "#",
  },
  {
    title: "Ralph Edwards",
    desc: "Hi! How are you doing?.....",
    active: false,
    hasnotifaction: true,
    notification_count: 8,
    image: User3,
    link: "#",
  },
  {
    title: "Cody Fisher",
    desc: "Hi! How are you doing?.....",
    active: true,
    hasnotifaction: false,
    image: User4,
    link: "#",
  },
];
