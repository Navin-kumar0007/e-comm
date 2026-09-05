"use client";

import { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import { Search, FileText, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateOrderStatusAction, deleteOrderAction, updateOrderTrackingAction } from "@/app/actions/admin-orders";
import { toast } from "sonner";

export default function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  const handleExpand = (order: any) => {
    if (expandedId === order.id) {
      setExpandedId(null);
    } else {
      setExpandedId(order.id);
      setTrackingNumber(order.trackingNumber || "");
      setTrackingUrl(order.trackingUrl || "");
    }
  };

  const handleSaveTracking = async (id: string) => {
    setIsSavingTracking(true);
    try {
      await updateOrderTrackingAction(id, trackingNumber, trackingUrl);
      setOrders(orders.map(o => o.id === id ? { ...o, trackingNumber, trackingUrl } : o));
      toast.success("Tracking details saved");
    } catch (err) {
      toast.error("Failed to save tracking details");
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateOrderStatusAction(id, newStatus);
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      toast.success(`Order ${id} status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete order ${id}? This cannot be undone.`)) {
      try {
        await deleteOrderAction(id);
        setOrders(orders.filter(o => o.id !== id));
        toast.success(`Order ${id} deleted`);
      } catch (err) {
        toast.error("Failed to delete order");
      }
    }
  };

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q));
    }
    if (activeTab !== 'all') list = list.filter(o => o.status === activeTab);
    return list;
  }, [orders, searchQuery, activeTab]);

  const getStatusColor = (status: string) => {
    const m: Record<string, string> = {
      Delivered: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      Shipped: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
      Confirmed: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
      Cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
      Pending: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
    };
    return m[status] || m.Pending;
  };

  const tabs = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'Pending', label: 'Pending', count: orders.filter(o => o.status === 'Pending').length },
    { key: 'Confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'Confirmed').length },
    { key: 'Shipped', label: 'Shipped', count: orders.filter(o => o.status === 'Shipped').length },
    { key: 'Delivered', label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length },
    { key: 'Cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and fulfill customer orders ({orders.length} total)</p>
        </div>
        <Link href="/admin/orders/new">
          <Button className="rounded-full shadow-md"><Plus className="w-4 h-4 mr-2" /> Create Order</Button>
        </Link>
      </div>

      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-card shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search order ID, customer..." className="pl-10 rounded-xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 rounded-l-xl w-8"></th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No orders found</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <Fragment key={order.id}>
                    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-4">
                        <button onClick={() => handleExpand(order)} className="text-muted-foreground hover:text-foreground">
                          {expandedId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-bold text-foreground">{order.id}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground">{order.customer}</div>
                        <div className="text-xs text-muted-foreground">{order.email}</div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{order.date}</td>
                      <td className="px-4 py-4 text-muted-foreground">{order.items.length} item(s)</td>
                      <td className="px-4 py-4 font-medium text-foreground">₹{order.total.toFixed(2)}</td>
                      <td className="px-4 py-4"><Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge></td>
                      <td className="px-4 py-4">
                        <select className="text-sm bg-transparent border rounded-lg px-2 py-1 font-medium focus:ring-1 focus:ring-primary cursor-pointer text-foreground" value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}>
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="icon" title="Invoice"><FileText className="w-4 h-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(order.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr key={`${order.id}-details`} className="bg-muted/10">
                        <td colSpan={9} className="px-8 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Items</h4>
                              {order.items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0 text-foreground">
                                  <span>{item.name} <span className="text-muted-foreground">× {item.quantity}</span> <span className="text-xs text-muted-foreground">({item.weight})</span></span>
                                  <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Shipping Address</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">{order.shippingAddress}</p>
                              {order.phone && <><h4 className="font-semibold text-xs uppercase text-muted-foreground mb-1 mt-3">Phone</h4><p className="text-sm text-muted-foreground">{order.phone}</p></>}
                              
                              <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2 mt-4">Logistics & Tracking</h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">Tracking Number</label>
                                  <Input 
                                    placeholder="e.g. AWB123456789" 
                                    className="h-8 text-sm" 
                                    value={trackingNumber} 
                                    onChange={(e) => setTrackingNumber(e.target.value)} 
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">Tracking URL</label>
                                  <Input 
                                    placeholder="e.g. https://shiprocket.in/tracking/..." 
                                    className="h-8 text-sm" 
                                    value={trackingUrl} 
                                    onChange={(e) => setTrackingUrl(e.target.value)} 
                                  />
                                </div>
                                <Button 
                                  size="sm" 
                                  className="w-full text-xs h-8" 
                                  onClick={() => handleSaveTracking(order.id)}
                                  disabled={isSavingTracking}
                                >
                                  {isSavingTracking ? "Saving..." : "Save Tracking Info"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
