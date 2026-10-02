// sidebarConfigpaytrackadminadmin.js
//
// paytrackadminadmin
// PaymentOS — Admin
//
// Admin navigation:
// Dashboard
// Merchants
// Branches
// Transactions
// Earnings
// Reports
//   ├── Per Branch
//   ├── Per Mode
//   ├── Per Month
//   └── Per Day
// Users
// Admins

export const sidebarConfig = [

  // =========================================================
  // DASHBOARD
  // =========================================================

  // {
  //   type: "link",
  //   label: "Dashboard",
  //   icon: "fa fa-dashboard",
  //   href: (routes) => `${routes.paytrackadmin}/dashboard/main`,
  //   roles: []
  // },

  {
    type: "link",
    label: "Home",
    icon: "fa fa-home",
    href: (routes) => `${routes.paytrackadmin}/dashboard/retail`,
    roles: []
  },


  // =========================================================
  // MERCHANTS
  // =========================================================

  {
    type: "link",
    label: "Merchants",
    icon: "fa fa-building",
    href: (routes) => `${routes.paytrackadmin}/merchants/list`,
    roles: []
  },


  // =========================================================
  // BRANCHES
  // =========================================================

  {
    type: "link",
    label: "Branches",
    icon: "fa fa-bolt",
    href: (routes) => `${routes.paytrackadmin}/branches/list`,
    roles: []
  },

  // =========================================================
  // TRANSACTIONS
  // =========================================================

  {
    type: "link",
    label: "Transactions",
    icon: "fa fa-exchange",
    href: (routes) => `${routes.paytrackadmin}/moneyflow/list`,
    roles: []
  },


  // =========================================================
  // EARNINGS
  // =========================================================

  {
    type: "link",
    label: "Earnings",
    icon: "fa fa-money",
    href: (routes) => `${routes.paytrackadmin}/earnings`,
    roles: []
  },


  // =========================================================
  // REPORTS
  // =========================================================

  {
    type: "submenu",
    label: "Reports",
    icon: "fa fa-bar-chart",
    roles: [],
    items: [

      {
        label: "Per Branch",
        href: (routes) => `${routes.paytrackadmin}/moneyflow/bybranch`,
        roles: []
      },

      {
        label: "Per Mode",
        href: (routes) => `${routes.paytrackadmin}/moneyflow/bymethod`,
        roles: []
      },

      {
        label: "Per Month",
        href: (routes) => `${routes.paytrackadmin}/moneyflow/bymonth`,
        roles: []
      },

      {
        label: "Per Day",
        href: (routes) => `${routes.paytrackadmin}/moneyflow/daily`,
        roles: []
      }

    ]
  },


  // =========================================================
  // USERS
  // =========================================================

  {
    type: "link",
    label: "Users",
    icon: "fa fa-users",
    href: (routes) => `${routes.paytrackadmin}/systemusers/list`,
    roles: []
  },


  // =========================================================
  // ADMINS
  // =========================================================

  // {
  //   type: "link",
  //   label: "Admins",
  //   icon: "fa fa-shield",
  //   href: (routes) => `${routes.paytrackadminadmin}/admins/list`,
  //   roles: []
  // }

];