import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Package, User, Star, Settings } from 'lucide-react';
import { AccountNav } from '@/components/storefront/account-nav';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-10">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 sticky top-32">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
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
  );
}
