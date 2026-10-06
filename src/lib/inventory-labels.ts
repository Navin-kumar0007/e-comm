// Pure data — safe for client components.

export type StockReason =
  | "SALE"
  | "RELEASE" // unpaid checkout expired / failed
  | "CANCEL_RESTOCK"
  | "RTO_RESTOCK"
  | "RESTOCK" // new purchase from supplier
  | "DAMAGE"
  | "CORRECTION" // stock count fix / admin edit
  | "ADMIN_ORDER"
  | "OPENING";

export const STOCK_REASON_LABELS: Record<StockReason, string> = {
  SALE: "Sold",
  RELEASE: "Unpaid order released",
  CANCEL_RESTOCK: "Order cancelled",
  RTO_RESTOCK: "Returned undelivered (RTO)",
  RESTOCK: "Restocked",
  DAMAGE: "Damaged / expired",
  CORRECTION: "Stock correction",
  ADMIN_ORDER: "Manual order",
  OPENING: "Opening stock",
};

