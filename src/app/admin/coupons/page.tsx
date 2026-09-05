import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Plus, Ticket, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import CouponDeleteButton from "./coupon-delete-button";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Coupons & Vouchers</h1>
          <p className="text-muted-foreground mt-1">Manage discount codes and print golden tickets</p>
        </div>
        <Link href="/admin/coupons/new">
          <Button className="rounded-full shadow-md"><Plus className="w-4 h-4 mr-2" /> Create Coupon</Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-500">Code</th>
              <th className="p-4 font-medium text-gray-500">Discount</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
              <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map(coupon => (
              <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-900">{coupon.code}</td>
                <td className="p-4 text-gray-600">
                  {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} Off
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {coupon.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  <Link href={`/admin/coupons/print/${coupon.id}`}>
                    <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200">
                      <Printer size={16} className="mr-1.5" /> Print Tag
                    </Button>
                  </Link>
                  <CouponDeleteButton id={coupon.id} />
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No coupons found. Create some in the database first.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
