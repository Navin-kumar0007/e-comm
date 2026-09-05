"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function CustomersClient({ initialCustomers }: { initialCustomers: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return initialCustomers;
    const q = searchQuery.toLowerCase();
    return initialCustomers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q)
    );
  }, [initialCustomers, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground mt-1">View and manage registered customers</p>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              className="pl-10 rounded-xl text-foreground" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Customer</th>
                <th className="px-4 py-3">Total Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4">
                       <div className="font-bold text-foreground">{customer.name}</div>
                       <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground">{customer.orders}</td>
                    <td className="px-4 py-4 font-medium text-foreground">₹{customer.spent.toFixed(2)}</td>
                    <td className="px-4 py-4">
                       <Badge variant="outline" className={customer.status === "Active" ? "bg-green-100 text-green-700 border-green-200" : customer.status === "Admin" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-gray-100 text-gray-700"}>
                         {customer.status}
                       </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
