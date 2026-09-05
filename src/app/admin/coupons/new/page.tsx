"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCouponAction } from "@/app/actions/admin-coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minPurchase: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createCouponAction(formData);
      toast.success("Coupon created successfully!");
      router.push("/admin/coupons");
    } catch (err) {
      toast.error("Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/coupons">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Create Coupon</h1>
          <p className="text-muted-foreground mt-1">Add a new discount code or gift voucher</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Coupon Code</label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input 
                required
                placeholder="e.g. SUMMER20 or GIFT500" 
                className="pl-10 uppercase font-mono text-lg"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <p className="text-xs text-gray-500">Customers will enter this code at checkout.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Discount Type</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.discountType}
                onChange={e => setFormData({ ...formData, discountType: e.target.value })}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Discount Value</label>
              <Input 
                type="number"
                required
                min={1}
                value={formData.discountValue}
                onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Minimum Purchase Amount (₹)</label>
            <Input 
              type="number"
              min={0}
              placeholder="0 for no minimum"
              value={formData.minPurchase || ""}
              onChange={e => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link href="/admin/coupons">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
              {loading ? "Creating..." : "Create Coupon"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
