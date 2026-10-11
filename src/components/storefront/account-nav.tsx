'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Leaf, Package, User, Star, Settings, Shield } from 'lucide-react';
import { isStaffRole } from '@/lib/permissions';
import { SignOutButton } from '@/components/sign-out-button';

export function AccountNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isStaff = isStaffRole((session?.user as { role?: string } | undefined)?.role);

  const navItems = [
    { href: '/account', label: 'Profile', icon: User },
    { href: '/account/orders', label: 'Order History', icon: Package },
    { href: '/account/rewards', label: 'Spice Points', icon: Star },
    { href: '/account/subscriptions', label: 'Subscriptions', icon: Leaf },
    { href: '/account/settings', label: 'Settings', icon: Settings },
  ];

  return (
    // Phones: one row of buttons that scrolls sideways, so the page itself shows first. Computers: a list.
    <nav className="flex gap-1 overflow-x-auto md:block md:space-y-2">
      {navItems.map((item) => {
        // Exact match for /account, otherwise startsWith for subroutes
        const isActive = item.href === '/account' 
          ? pathname === '/account' 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg transition-colors md:gap-3 ${
              isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-primary/10 hover:text-primary text-muted-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" /> {item.label}
          </Link>
        );
      })}
      {isStaff && (
        <Link href="/admin" className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg font-medium text-primary hover:bg-primary/10 md:gap-3">
          <Shield className="w-4 h-4" /> Admin Panel
        </Link>
      )}
      <div className="shrink-0 md:border-t md:border-border/60 md:pt-2">
        <SignOutButton className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-left text-destructive hover:bg-destructive/10 disabled:opacity-60 md:gap-3" />
      </div>
    </nav>
  );
}
