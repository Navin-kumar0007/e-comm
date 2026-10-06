import { describe, it, expect } from "vitest";
import { canTransition, nextAdminStatuses, CUSTOMER_CANCELLABLE } from "@/lib/order-status-rules";

describe("order status rules", () => {
  it("allows the normal forward path", () => {
    expect(canTransition("PENDING", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransition("DELIVERED", "RETURNED")).toBe(true);
  });

  it("blocks going backwards or reviving closed orders", () => {
    expect(canTransition("DELIVERED", "SHIPPED")).toBe(false);
    expect(canTransition("CANCELLED", "DELIVERED")).toBe(false);
    expect(canTransition("EXPIRED", "PROCESSING")).toBe(false);
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false); // must go RTO instead
  });

  it("admin dropdown never offers payment-driven statuses", () => {
    expect(nextAdminStatuses("PENDING")).toEqual(["CANCELLED"]);
    expect(nextAdminStatuses("SHIPPED")).toEqual(["DELIVERED", "RTO"]);
    expect(nextAdminStatuses("DELIVERED")).toEqual([]);
  });

  it("customers can cancel only before dispatch", () => {
    expect(CUSTOMER_CANCELLABLE).toEqual(["PENDING", "PROCESSING", "CONFIRMED"]);
  });
});
