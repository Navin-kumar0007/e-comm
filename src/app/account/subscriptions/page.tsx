import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, Calendar, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionActions from './subscription-actions';

export const metadata = {
  title: 'My Subscriptions | Spicy Nuts',
};

export default async function SubscriptionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  const subscriptions = user.subscriptions || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">My Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your recurring Taste of Spicy Nuts deliveries.
          </p>
        </div>
        <Link href="/subscribe">
          <Button className="rounded-xl">Subscribe to a new box</Button>
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">No active subscriptions</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You are not currently subscribed to any Taste of Spicy Nuts monthly boxes.
          </p>
          <Link href="/subscribe">
            <Button className="rounded-xl">Explore Subscription Boxes</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {subscriptions.map((sub: any) => (
            <div key={sub.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden">
              {sub.status === 'ACTIVE' && (
                <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
              )}
              {sub.status === 'CANCELLED' && (
                <div className="absolute top-0 right-0 w-2 h-full bg-destructive"></div>
              )}
              
              <div className="w-full md:w-48 h-48 bg-muted rounded-2xl flex items-center justify-center border border-border shrink-0">
                <Package className="w-16 h-16 text-muted-foreground/30" />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold font-heading">{sub.boxType}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-6">₹{sub.price} <span className="text-sm font-normal text-muted-foreground">/ month</span></p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Started On</p>
                        <p className="font-medium">{new Date(sub.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Next Delivery</p>
                        <p className="font-bold text-primary">{new Date(sub.nextDeliveryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Payment Method</p>
                        <p className="font-medium">Stored Card (Razorpay)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border flex gap-3">
                  <SubscriptionActions id={sub.id} status={sub.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
