'use client';

import Image from "next/image";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, CheckSquare, Square, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  deleteProductAction, 
  bulkDeleteProductsAction, 
  updateProductStatusAction, 
  bulkUpdateProductStatusAction 
} from "@/app/actions/admin-products";

type FilterTab = 'all' | 'ACTIVE' | 'DRAFT' | 'lowstock';

export default function AdminProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.categoryId || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    }
    if (activeTab === 'ACTIVE') list = list.filter(p => p.status === 'ACTIVE');
    else if (activeTab === 'DRAFT') list = list.filter(p => p.status === 'DRAFT');
    else if (activeTab === 'lowstock') list = list.filter(p => (p.stock ?? 0) < 20);
    return list;
  }, [products, searchQuery, activeTab]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      setIsPending(true);
      await deleteProductAction(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      toast.success(`"${name}" deleted`);
      setIsPending(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} product(s)?`)) {
      setIsPending(true);
      await bulkDeleteProductsAction(selectedIds);
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      toast.success(`${selectedIds.length} product(s) deleted`);
      setSelectedIds([]);
      setIsPending(false);
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    setIsPending(true);
    await bulkUpdateProductStatusAction(selectedIds, status);
    setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status } : p));
    toast.success(`${selectedIds.length} product(s) set to ${status}`);
    setSelectedIds([]);
    setIsPending(false);
  };

  const toggleProductStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    setIsPending(true);
    await updateProductStatusAction(id, newStatus);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    toast.success(`Status updated`);
    setIsPending(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const getStockBadge = (stock: number | undefined) => {
    const s = stock ?? 0;
    if (s >= 50) return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 text-xs">{s} in stock</Badge>;
    if (s >= 10) return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-xs">{s} low</Badge>;
    return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 text-xs">{s} critical</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 text-xs">Active</Badge>;
    if (status === 'DRAFT') return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 text-xs">Draft</Badge>;
    return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">Archived</Badge>;
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: products.length },
    { key: 'ACTIVE', label: 'Active', count: products.filter(p => p.status === 'ACTIVE').length },
    { key: 'DRAFT', label: 'Draft', count: products.filter(p => p.status === 'DRAFT').length },
    { key: 'lowstock', label: 'Low Stock', count: products.filter(p => (p.stock ?? 0) < 20).length },
  ];

  return (
    <div className={`space-y-6 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your store catalog ({products.length} products)</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="rounded-full shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedIds([]); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => handleBulkStatus('ACTIVE')}>Set Active</Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => handleBulkStatus('DRAFT')}>Set Draft</Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleBulkDelete}>Delete Selected</Button>
          <Button variant="ghost" size="sm" className="rounded-lg text-xs ml-auto" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, tags..."
              className="pl-10 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-3 py-3 rounded-l-xl w-10">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0
                      ? <CheckSquare className="w-4 h-4" />
                      : <Square className="w-4 h-4" />
                    }
                  </button>
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No products found</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-4">
                      <button onClick={() => toggleSelect(product.id)} className="text-muted-foreground hover:text-foreground">
                        {selectedIds.includes(product.id)
                          ? <CheckSquare className="w-4 h-4 text-primary" />
                          : <Square className="w-4 h-4" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-4 font-medium flex items-center gap-3 min-w-[200px]">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                        {product.images[0] && <Image width={800} height={800} unoptimized={false} src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="line-clamp-1 font-semibold">{product.name}</div>
                        <div className="text-xs text-muted-foreground flex gap-1 mt-0.5">
                          {(product.tags || []).slice(0, 2).map((t: string) => (
                            <span key={t} className="bg-muted px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground capitalize">{(product.categoryId || 'Uncategorized').replace('-id', '').replace(/-/g, ' ')}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium">₹{product.salePrice || product.price}</div>
                      {product.salePrice && <div className="text-xs text-muted-foreground line-through">₹{product.price}</div>}
                    </td>
                    <td className="px-4 py-4">{getStockBadge(product.stock)}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleProductStatus(product.id, product.status || 'ACTIVE')}>
                        {getStatusBadge(product.status || 'ACTIVE')}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/products/label/${product.id}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Print Label">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/edit/${product.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(product.id, product.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
