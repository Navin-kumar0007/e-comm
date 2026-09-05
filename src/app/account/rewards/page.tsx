import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Crown, Sparkles, TrendingUp, ShoppingBag } from 'lucide-react';

export const metadata = {
  title: 'Spice Points | Nutty World',
};

export default async function RewardsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { points: true, name: true }
  });

  if (!user) {
    redirect('/login');
  }

  const points = user.points;
  
  // Tier Calculation
  let tierName = "Bronze Seed";
  let nextTierName = "Silver Clove";
  let tierProgress = 0;
  let pointsToNext = 500 - points;
  let tierColor = "text-amber-700 bg-amber-700/10 border-amber-700/20";
  let iconColor = "text-amber-700";
  
  if (points >= 1500) {
    tierName = "Platinum Vanilla";
    nextTierName = "Max Tier";
    tierProgress = 100;
    pointsToNext = 0;
    tierColor = "text-slate-600 bg-slate-600/10 border-slate-600/20";
    iconColor = "text-slate-600";
  } else if (points >= 500) {
    tierName = "Gold Saffron";
    nextTierName = "Platinum Vanilla";
    tierProgress = ((points - 500) / 1000) * 100;
    pointsToNext = 1500 - points;
    tierColor = "text-yellow-600 bg-yellow-600/10 border-yellow-600/20";
    iconColor = "text-yellow-600";
  } else {
    tierName = "Silver Clove";
    nextTierName = "Gold Saffron";
    tierProgress = (points / 500) * 100;
    pointsToNext = 500 - points;
    tierColor = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
    iconColor = "text-zinc-500";
  }

  const currencyValue = Math.floor(points / 10);

  return (
    <div className="container max-w-5xl py-28 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Spice Points & Rewards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user.name?.split(' ')[0]}. Track your loyalty points and member benefits.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-sm font-bold text-primary">
          <Sparkles className="w-4 h-4" /> Earn 5% back on every order
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        {/* Left Column: Stats & Progress */}
        <div className="md:col-span-7 space-y-8">
          
          {/* Main Balance Card */}
          <div className="glass-card bg-card/60 rounded-3xl p-8 border border-border/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Crown className="w-32 h-32" />
            </div>
            
            <div className="mb-8">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tierColor}`}>
                <Crown className={`w-3.5 h-3.5 ${iconColor}`} /> {tierName} Member
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Available Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-heading font-bold text-primary">{points}</span>
                  <span className="text-lg font-medium text-muted-foreground">pts</span>
                </div>
              </div>
              <div className="h-12 w-px bg-border hidden md:block"></div>
              <div className="pb-1.5">
                <p className="text-sm font-medium text-muted-foreground mb-1">Rupee Value</p>
                <span className="text-2xl font-bold text-foreground">₹{currencyValue}</span>
              </div>
            </div>

            {pointsToNext > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {nextTierName}</span>
                  <span className="font-bold">{pointsToNext} pts needed</span>
                </div>
                <div className="h-3 w-full bg-secondary/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all duration-1000 ease-out rounded-full" 
                    style={{ width: `${tierProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* How to Earn */}
          <div className="bg-secondary/5 border border-secondary/15 rounded-3xl p-8">
            <h3 className="font-heading font-bold text-lg text-secondary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> How it Works
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Earn Points on Every Purchase</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    You automatically earn points equivalent to 5% of your total order value. (e.g. Spend ₹1000, earn 50 points).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Track Your Tiers</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accumulate points to reach Gold Saffron and Platinum Vanilla tiers for exclusive early access to rare seasonal harvests.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Redeem at Checkout</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Every 10 points = ₹1 off. Easily apply your available points during the checkout process to instantly discount your order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tiers Info & CTA */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
            <h3 className="font-heading font-bold text-lg mb-6">Loyalty Tiers</h3>
            
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${points < 500 ? 'bg-zinc-500/10 border-zinc-500/30' : 'bg-background border-border'} relative`}>
                <h4 className="font-bold text-zinc-600 flex items-center gap-2">
                  Silver Clove {points < 500 && <span className="absolute right-4 text-xs font-bold bg-zinc-500 text-white px-2 py-0.5 rounded-full">Current</span>}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">0 - 499 points</p>
                <ul className="text-xs mt-3 space-y-1.5 text-muted-foreground">
                  <li>• 5% back on purchases</li>
                  <li>• Standard Shipping Rates</li>
                </ul>
              </div>

              <div className={`p-4 rounded-2xl border ${points >= 500 && points < 1500 ? 'bg-yellow-600/10 border-yellow-600/30' : 'bg-background border-border'} relative`}>
                <h4 className="font-bold text-yellow-600 flex items-center gap-2">
                  Gold Saffron {points >= 500 && points < 1500 && <span className="absolute right-4 text-xs font-bold bg-yellow-600 text-white px-2 py-0.5 rounded-full">Current</span>}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">500 - 1499 points</p>
                <ul className="text-xs mt-3 space-y-1.5 text-muted-foreground">
                  <li>• 5% back on purchases</li>
                  <li>• Free shipping over ₹999</li>
                  <li>• 1x Free Monthly Spice Sample</li>
                </ul>
              </div>

              <div className={`p-4 rounded-2xl border ${points >= 1500 ? 'bg-slate-600/10 border-slate-600/30' : 'bg-background border-border'} relative`}>
                <h4 className="font-bold text-slate-600 flex items-center gap-2">
                  Platinum Vanilla {points >= 1500 && <span className="absolute right-4 text-xs font-bold bg-slate-600 text-white px-2 py-0.5 rounded-full">Current</span>}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">1500+ points</p>
                <ul className="text-xs mt-3 space-y-1.5 text-muted-foreground">
                  <li>• 5% back on purchases</li>
                  <li>• Free shipping on ALL orders</li>
                  <li>• Early access to seasonal harvests</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 text-center">
            <h3 className="font-bold mb-2">Ready to earn more?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Explore our latest organic collections and start building your Spice Points today.
            </p>
            <Link href="/shop" className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors">
              <ShoppingBag className="w-4 h-4" /> Shop Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
