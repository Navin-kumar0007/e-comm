// Staff roles and what each may do. Pure data — safe for client components.

export const STAFF_ROLES = ["ADMIN", "MANAGER", "SUPPORT", "PACKER"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  "dashboard.view", // admin area + "needs attention" counters
  "reports.view", // sales, margins, top products
  "orders.view",
  "orders.update", // confirm / ship / deliver, notes, tracking
  "orders.cancel", // cancel / RTO (triggers stock return + refunds)
  "orders.create", // manual orders
  "orders.delete",
  "orders.export",
  "shipping.manage", // book / sync / cancel courier shipments
  "refunds.issue",
  "returns.manage",
  "inventory.manage",
  "purchases.manage", // suppliers, purchase orders, receiving goods, costs
  "finance.manage", // expenses, supplier payments, COD remittances, payment reconciliation
  "catalog.manage", // products, sizes, categories, recipes, dietary tags
  "marketing.manage", // coupons, WhatsApp broadcasts, points
  "customers.view", // customer list, inquiries, subscriptions
  "reviews.moderate",
  "settings.manage",
  "staff.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  ADMIN: ALL,
  MANAGER: ALL.filter((p) => p !== "settings.manage" && p !== "staff.manage"),
  SUPPORT: ["dashboard.view", "orders.view", "orders.update", "orders.cancel", "returns.manage", "reviews.moderate", "customers.view"],
  PACKER: ["dashboard.view", "orders.view", "orders.update", "shipping.manage", "inventory.manage"],
};

export const ROLE_LABELS: Record<StaffRole, { name: string; description: string }> = {
  ADMIN: { name: "Owner / Admin", description: "Everything, including settings and staff." },
  MANAGER: { name: "Manager", description: "Runs the store: orders, refunds, products, marketing, reports. No settings or staff." },
  SUPPORT: { name: "Customer Support", description: "Orders, cancellations, returns, reviews, customers. No refunds or reports." },
  PACKER: { name: "Packing / Dispatch", description: "View orders, book shipments, mark shipped/delivered, adjust stock." },
};

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function roleCan(role: string | null | undefined, permission: Permission) {
  return isStaffRole(role) && ROLE_PERMISSIONS[role].includes(permission);
}
