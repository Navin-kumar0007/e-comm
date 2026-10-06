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
  MessageSquare,
  MessageCircle,
  Menu,
  RotateCcw,
  UserCog,
  Warehouse,
  Star
} from "lucide-react";
import { ThemeToggle } from "@/components/storefront/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getStaffContext } from "@/lib/auth-guard";
import { ROLE_LABELS, type Permission } from "@/lib/permissions";

const allLinks: Array<{ href: string; label: string; icon: any; permission: Permission }> = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders.view" },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw, permission: "returns.manage" },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse, permission: "inventory.manage" },
  { href: "/admin/products", label: "Products", icon: Package, permission: "catalog.manage" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, permission: "catalog.manage" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.view" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews.moderate" },
  { href: "/admin/messages", label: "Customer Inquiries", icon: MessageSquare, permission: "customers.view" },
  { href: "/admin/whatsapp", label: "WhatsApp Marketing", icon: MessageCircle, permission: "marketing.manage" },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, permission: "marketing.manage" },
  { href: "/admin/recipes", label: "Recipes", icon: ChefHat, permission: "catalog.manage" },
  { href: "/admin/dietary", label: "Dietary Profiles", icon: ListChecks, permission: "catalog.manage" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat, permission: "customers.view" },
  { href: "/admin/points", label: "Spice Points", icon: Sparkles, permission: "marketing.manage" },
  { href: "/admin/staff", label: "Staff", icon: UserCog, permission: "staff.manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Role is read fresh from the database, so removed staff lose access immediately.
  const staff = await getStaffContext();
  if (!staff) {
    const session = await auth();
    redirect(session?.user ? "/" : "/login");
  }
  const sidebarLinks = allLinks.filter((l) => staff.can(l.permission));

  const NavLinks = () => (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-3 text-xs text-muted-foreground">
          {staff.user.name} · {ROLE_LABELS[staff.role].name}
        </p>
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
    </>
  );

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row print:bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border/50 shrink-0 min-h-screen flex-col print:hidden">
        <div className="p-6 border-b border-border/50 flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-heading font-bold text-lg">Admin Panel</span>
        </div>
        <NavLinks />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 bg-card border-b border-border/50 flex items-center justify-between px-4 sm:px-6 lg:px-8 print:hidden">
           <div className="flex items-center gap-4">
             {/* Mobile Hamburger */}
             <Sheet>
               <SheetTrigger
                 aria-label="Open menu"
                 className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
               >
                 <Menu className="w-5 h-5" />
               </SheetTrigger>
               <SheetContent side="left" className="w-64 p-0 flex flex-col border-r-0" showCloseButton={false}>
                 <div className="p-6 border-b border-border/50 flex items-center gap-2">
                   <Leaf className="h-6 w-6 text-primary" />
                   <span className="font-heading font-bold text-lg">Admin Panel</span>
                 </div>
                 <NavLinks />
               </SheetContent>
             </Sheet>
             <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
               Spicy Nuts Operations
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
