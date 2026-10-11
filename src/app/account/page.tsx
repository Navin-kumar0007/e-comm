import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Package, Award, MessageCircle, Truck, LifeBuoy, Mail, ChevronRight } from "lucide-react";
import { BRAND_WHATSAPP } from "@/lib/contact";
import { format } from "date-fns";
import Link from "next/link";

const getStatusColor = (status: string) => {
  const m: Record<string, string> = {
    DELIVERED: "bg-success/10 text-success dark:bg-success/30 dark:text-success",
    SHIPPED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CONFIRMED: "bg-muted text-brand-gold-deep dark:bg-royal-deep/30 dark:text-brand-gold",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    EXPIRED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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
    { label: "Total Orders", value: totalOrdersCount.toString(), icon: Package, color: "text-primary bg-muted" },
    { label: "Loyalty Points", value: user.points.toLocaleString(), icon: Award, color: "text-brand-gold-deep bg-muted dark:bg-royal-deep/30" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="royal-card p-6 md:p-8">
        <h1 className="text-[30px] font-heading font-bold leading-none text-primary mb-2">
          Welcome back, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a quick overview of your organic journey with us.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="royal-card p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders Preview */}
      <div className="royal-card p-6">
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

      {/* Help lives here on phones instead of floating buttons over every page */}
      <section aria-labelledby="help-title">
        <h2 id="help-title" className="eyebrow mb-2 ml-1 text-brand-gold-deep">Help</h2>
        <div className="royal-card divide-y divide-border overflow-hidden p-0">
          {[
            { href: `https://wa.me/${BRAND_WHATSAPP}?text=${encodeURIComponent("Hi Spicy Nuts! I need help with my order.")}`, label: "Chat on WhatsApp", icon: MessageCircle, external: true },
            { href: "/track", label: "Track an order", icon: Truck },
            { href: "/help", label: "Help centre", icon: LifeBuoy },
            { href: "/contact", label: "Contact us", icon: Mail },
          ].map(({ href, label, icon: Icon, external }) => (
            <Link key={label} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="tap flex min-h-14 items-center gap-3 px-4 text-[15px] font-semibold hover:bg-muted/60">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-muted text-primary"><Icon className="h-[18px] w-[18px]" /></span>
              {label}
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
