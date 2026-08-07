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
  {
    isHeadr: true,
    title: "Zoho",
  },

  {
    title: "Vendor Bill",
    isHide: true,
    icon: "heroicons-outline:document-text",
    link: "/zoho/vendor-bill",
  },
  {
    title: "Journal Entry",
    isHide: true,
    icon: "heroicons-outline:document",
    link: "/zoho/journal-entry",
  },
  {
    title: "Expense Bill",
    isHide: true,
    icon: "heroicons-outline:clipboard",
    link: "/zoho/expense-bill",
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

  {
    title: "Purchase Voucher",
    isHide: true,
    icon: "heroicons-outline:document-text",
    link: "/tally/vendor-bill",
  },

  {
    title: "Journal Entry",
    isHide: true,
    icon: "heroicons-outline:clipboard",
    link: "/tally/expense-bill",
  },

  {
    title: "Payment Voucher",
    isHide: true,
    icon: "heroicons-outline:credit-card",
    link: "/tally/payment-voucher",
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
