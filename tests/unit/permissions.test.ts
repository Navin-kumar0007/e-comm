import { describe, it, expect } from "vitest";
import { roleCan, isStaffRole } from "@/lib/permissions";

describe("staff permissions", () => {
  it("owner can do everything", () => {
    expect(roleCan("ADMIN", "settings.manage")).toBe(true);
    expect(roleCan("ADMIN", "staff.manage")).toBe(true);
  });
  it("manager runs the store but can't change settings or staff", () => {
    expect(roleCan("MANAGER", "refunds.issue")).toBe(true);
    expect(roleCan("MANAGER", "settings.manage")).toBe(false);
    expect(roleCan("MANAGER", "staff.manage")).toBe(false);
  });
  it("packer can ship and adjust stock, but not refund, cancel or see sales", () => {
    expect(roleCan("PACKER", "shipping.manage")).toBe(true);
    expect(roleCan("PACKER", "inventory.manage")).toBe(true);
    expect(roleCan("PACKER", "refunds.issue")).toBe(false);
    expect(roleCan("PACKER", "orders.cancel")).toBe(false);
    expect(roleCan("PACKER", "reports.view")).toBe(false);
  });
  it("support handles customers but not money", () => {
    expect(roleCan("SUPPORT", "returns.manage")).toBe(true);
    expect(roleCan("SUPPORT", "refunds.issue")).toBe(false);
    expect(roleCan("SUPPORT", "catalog.manage")).toBe(false);
  });
  it("customers have no staff permissions", () => {
    expect(isStaffRole("USER")).toBe(false);
    expect(roleCan("USER", "dashboard.view")).toBe(false);
    expect(roleCan(undefined, "orders.view")).toBe(false);
  });
});
