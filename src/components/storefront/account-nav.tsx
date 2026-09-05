'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Package, User, Star, Settings } from 'lucide-react';

export function AccountNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/account', label: 'Profile', icon: User },
    { href: '/account/orders', label: 'Order History', icon: Package },
    { href: '/account/rewards', label: 'Spice Points', icon: Star },
    { href: '/account/subscriptions', label: 'Subscriptions', icon: Leaf },
    { href: '/account/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        // Exact match for /account, otherwise startsWith for subroutes
        const isActive = item.href === '/account' 
          ? pathname === '/account' 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-primary/10 hover:text-primary text-muted-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
