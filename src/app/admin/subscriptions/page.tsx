import { prisma } from "@/lib/db/prisma";
import { Package, TrendingUp, Users } from "lucide-react";
import MarkDeliveredButton from "./mark-delivered-button";

export default async function AdminSubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });

  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const mrr = subscriptions.filter(s => s.status === 'ACTIVE').reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Taste of Nutty World Box</h1>
        <p className="text-muted-foreground mt-1">Manage active monthly subscription boxes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Active Subscribers</p>
            <p className="text-3xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Recurring Revenue (MRR)</p>
            <p className="text-3xl font-bold text-gray-900">₹{mrr.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-500">Customer</th>
              <th className="p-4 font-medium text-gray-500">Box Type</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
              <th className="p-4 font-medium text-gray-500">Next Delivery</th>
              <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subscriptions.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-gray-900">{sub.user.name}</div>
                  <div className="text-sm text-gray-500">{sub.user.email}</div>
                </td>
                <td className="p-4 font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    {sub.boxType}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">₹{sub.price}/mo</div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="p-4 text-gray-700 font-medium">
                  {new Date(sub.nextDeliveryDate).toLocaleDateString()}
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  {sub.status === 'ACTIVE' && (
                    <MarkDeliveredButton id={sub.id} />
                  )}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No subscriptions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
