import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Leaf,
  ChefHat,
  ListChecks,
  Ticket,
  Sparkles,
  Repeat,
  FolderTree,
  MessageSquare
} from "lucide-react";
import { ThemeToggle } from "@/components/storefront/ThemeToggle";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/messages", label: "Customer Inquiries", icon: MessageSquare },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/recipes", label: "Recipes", icon: ChefHat },
  { href: "/admin/dietary", label: "Dietary Profiles", icon: ListChecks },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/admin/points", label: "Spice Points", icon: Sparkles },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row print:bg-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border/50 shrink-0 md:min-h-screen flex flex-col print:hidden">
        <div className="p-4 md:p-6 border-b border-border/50 flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-heading font-bold text-lg">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border/50">
           <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Back to Store
            </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border/50 flex items-center justify-between px-4 sm:px-6 lg:px-8 print:hidden">
           <div>
             <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
               Nutty World Operations
             </span>
           </div>
           <div className="flex items-center gap-4">
             <ThemeToggle />
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                A
             </div>
           </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
