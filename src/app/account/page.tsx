import { auth } from "@/lib/auth";
import { Package, Leaf, Award, TrendingUp } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();

  const stats = [
    { label: "Total Orders", value: "3", icon: Package, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
    { label: "Loyalty Points", value: "1,250", icon: Award, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
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
        <h2 className="text-xl font-heading font-bold mb-4">Recent Orders</h2>
        <div className="space-y-3">
          {[
            { id: "MK-LXYZ12", date: "Aug 20, 2026", total: "₹748.00", status: "Delivered", statusColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
            { id: "MK-ABCD34", date: "Aug 15, 2026", total: "₹1,249.00", status: "Shipped", statusColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
            { id: "MK-EFGH56", date: "Aug 10, 2026", total: "₹450.00", status: "Delivered", statusColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
          ].map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="font-semibold text-sm">{order.id}</p>
                <p className="text-xs text-muted-foreground">{order.date}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <span className="font-medium text-sm">{order.total}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${order.statusColor}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
