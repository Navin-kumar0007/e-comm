import Link from "next/link";
import { ArrowUpRight, DollarSign, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAdminProducts } from "@/app/actions/admin-products";
import { getAdminOrders } from "@/app/actions/admin-orders";

export default async function AdminDashboard() {
  const products = await getAdminProducts();
  const orders = await getAdminOrders();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
  const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock < 20 && p.status === 'ACTIVE');
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: "text-green-600 bg-green-500/10" },
    { label: "Total Orders", value: String(orders.length), icon: ShoppingCart, color: "text-blue-600 bg-blue-500/10" },
    { label: "Active Products", value: String(activeProducts), icon: Package, color: "text-purple-600 bg-purple-500/10" },
    { label: "Pending Orders", value: String(pendingOrders), icon: AlertTriangle, color: "text-amber-600 bg-amber-500/10" },
  ];

  const getStatusColor = (status: string) => {
    const m: Record<string, string> = {
      Delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Shipped: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Confirmed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      Pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    };
    return m[status] || m.Pending;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Live metrics from your online grocery store</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-bold text-foreground">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">View all <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase">
                <tr><th className="px-3 py-2 text-left">Order</th><th className="px-3 py-2 text-left">Customer</th><th className="px-3 py-2 text-left">Total</th><th className="px-3 py-2 text-left">Status</th></tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-t border-border/30">
                    <td className="px-3 py-3 font-bold text-foreground">{o.id}</td>
                    <td className="px-3 py-3 text-muted-foreground">{o.customer}</td>
                    <td className="px-3 py-3 text-muted-foreground">₹{o.total.toFixed(0)}</td>
                    <td className="px-3 py-3"><Badge variant="outline" className={getStatusColor(o.status) + " text-xs"}>{o.status}</Badge></td>
                  </tr>
                ))}
                {recentOrders.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-bold text-foreground">Low Stock Alerts</h2>
            <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">{lowStockProducts.length}</Badge>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">All products are well-stocked ✓</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <div className="text-sm font-medium line-clamp-1 text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.weight}</div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${p.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
