import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Package, Leaf, Award, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

const getStatusColor = (status: string) => {
  const m: Record<string, string> = {
    DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    SHIPPED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CONFIRMED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    PENDING: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    PROCESSING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return m[status] || m.PENDING;
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (!user) return null;

  const totalOrdersCount = await prisma.order.count({
    where: { userId: user.id },
  });

  const stats = [
    { label: "Total Orders", value: totalOrdersCount.toString(), icon: Package, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
    { label: "Loyalty Points", value: user.points.toLocaleString(), icon: Award, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
    { label: "Carbon Saved", value: "2.4 kg", icon: Leaf, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
    { label: "Avg. Savings", value: "₹340", icon: TrendingUp, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-brand-gold/10 border border-border/50">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Welcome back, {session?.user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a quick overview of your organic journey with us.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl bg-card border border-border/50">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders Preview */}
      <div className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {user.orders.length > 0 ? (
            user.orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <p className="font-semibold text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{format(order.createdAt, "MMM dd, yyyy")}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="font-medium text-sm">₹{order.total.toFixed(2)}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No orders found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
