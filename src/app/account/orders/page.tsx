import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

export const metadata = {
  title: 'My Orders - Nutty World',
};

function OrderTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'PENDING', label: 'Order Placed', icon: Clock },
    { id: 'PROCESSING', label: 'Processing', icon: Package },
    { id: 'SHIPPED', label: 'Shipped', icon: Truck },
    { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ];

  const currentIndex = steps.findIndex(s => s.id === status) || 0;

  return (
    <div className="relative mt-6 mb-8">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full" />
      <div 
        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-1000" 
        style={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
      />
      
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'bg-background border-white/20 text-muted-foreground'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-8 text-primary">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-xl">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground">When you place orders, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Order <span className="font-mono text-foreground">#{order.id.slice(-8).toUpperCase()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-xl font-bold text-secondary">₹{order.total.toFixed(2)}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                    order.status === 'DELIVERED' ? 'bg-primary/20 text-primary border border-primary/30' :
                    order.status === 'CANCELLED' ? 'bg-destructive/20 text-destructive border border-destructive/30' :
                    'bg-secondary/20 text-secondary border border-secondary/30'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {order.status !== 'CANCELLED' && (
                <OrderTimeline status={order.status} />
              )}
              
              {(order.trackingNumber || order.trackingUrl) && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full text-primary">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Tracking Information</p>
                    <div className="mt-1 flex items-center gap-2">
                      {order.trackingUrl ? (
                        <a 
                          href={order.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {order.trackingNumber || "Track your order"}
                        </a>
                      ) : (
                        <span className="font-medium text-foreground">{order.trackingNumber}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button className="text-sm font-medium text-primary hover:underline underline-offset-4">View Details</button>
                <a href={`/account/orders/invoice/${order.id}`} target="_blank" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Download Invoice</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
