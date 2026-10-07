import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Package, User, Star, Settings } from 'lucide-react';
import { AccountNav } from '@/components/storefront/account-nav';
import { PageHero } from "@/components/storefront/royal/page-hero";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
    <PageHero eyebrow="My account" title={`Namaste, ${session.user.name?.split(' ')[0] || 'friend'}`} subtitle="Orders, rewards, subscriptions and settings in one place." compact />
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-8 md:pb-10">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="royal-card p-5 sticky top-[calc(var(--header-h)+16px)]">
            <div className="flex items-center gap-4 mb-8">
              <div className="arch w-12 h-14 bg-primary border-2 border-brand-gold flex items-center justify-center text-primary-foreground font-heading font-bold text-2xl">
                {session.user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{session.user.name}</h3>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              </div>
            </div>
            
            <AccountNav />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
    </>
  );
}
