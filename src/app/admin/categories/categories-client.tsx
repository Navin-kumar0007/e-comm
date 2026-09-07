'use client';

import { useState } from "react";
import Link from "next/link";
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  ExternalLink, 
  Search, 
  X, 
  Layers,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  createCategoryAction, 
  updateCategoryAction, 
  deleteCategoryAction 
} from "@/app/actions/admin-categories";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  productsCount: number;
  createdAt: string;
}

export default function CategoriesClient({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setImage(cat.image || "");
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const updated = await updateCategoryAction(editingCategory.id, {
          name,
          slug,
          description,
          image: image || undefined
        });
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name, slug, description, image: image || null } : c));
        toast.success("Category updated successfully!");
      } else {
        const created = await createCategoryAction({
          name,
          slug,
          description,
          image: image || undefined
        });
        setCategories(prev => [...prev, {
          id: created.id,
          name: created.name,
          slug: created.slug,
          description: created.description,
          image: created.image || null,
          productsCount: 0,
          createdAt: new Date().toISOString()
        }]);
        toast.success("Category created successfully!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (cat.productsCount > 0) {
      toast.error(`Cannot delete "${cat.name}". It still contains ${cat.productsCount} product(s).`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      await deleteCategoryAction(cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      toast.success(`Category "${cat.name}" deleted successfully.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize your dry fruits, exotic spices, and luxury gifting collections ({categories.length} total)
          </p>
        </div>
        <Button onClick={openAddModal} className="rounded-full shadow-md gap-2 font-semibold">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          Showing {filteredCategories.length} of {categories.length}
        </div>
      </div>

      {/* Categories Table Card */}
      <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/40">
              <tr>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-4 py-3.5">Slug & URL</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5 text-center">Products</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No categories found. Click "Add Category" to create your first one.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-border/40 overflow-hidden flex items-center justify-center shrink-0">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <Layers className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{cat.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {cat.id.slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                      <Link 
                        href={`/category/${cat.slug}`} 
                        target="_blank" 
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        /category/{cat.slug} <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground max-w-xs line-clamp-2">
                      {cat.description}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5">
                        <Package className="w-3 h-3 mr-1" /> {cat.productsCount}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditModal(cat)} 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(cat)} 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete"
                          disabled={cat.productsCount > 0}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border/60 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-xl text-foreground">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="catName" className="text-xs font-semibold">Category Name *</Label>
                <Input
                  id="catName"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Royal Gift Hampers, Kashmiri Walnuts"
                  className="rounded-xl h-11"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catSlug" className="text-xs font-semibold">URL Slug *</Label>
                <Input
                  id="catSlug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. royal-gift-hampers"
                  className="rounded-xl h-11 font-mono text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Will be accessible at: /category/{slug || "slug"}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catImage" className="text-xs font-semibold">Banner Image URL</Label>
                <Input
                  id="catImage"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /images/..."
                  className="rounded-xl h-11 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catDesc" className="text-xs font-semibold">Description *</Label>
                <Textarea
                  id="catDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this collection's terroir origin, flavor profile, or harvest standard..."
                  className="rounded-xl text-sm min-h-[90px]"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/40">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 rounded-xl shadow-md font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
