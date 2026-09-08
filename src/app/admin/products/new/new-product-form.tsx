"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createProductAction } from "@/app/actions/admin-products";

export default function NewProductForm({ categories, dietaryTags }: { categories: {id: string, name: string}[], dietaryTags: {id: string, name: string}[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isOrganic, setIsOrganic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">("ACTIVE");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };
  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
      else toast.error("Upload failed");
    } catch(err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    
    try {
      await createProductAction({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: fd.get("desc") as string,
        price: Number(fd.get("price")),
        salePrice: onSale ? Number(fd.get("salePrice")) : null,
        images: [imageUrl || "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop"],
        categoryId: fd.get("category") as string,
        stock: Number(fd.get("stock")) || 0,
        weight: fd.get("weight") as string || "250g",
        tags,
        isFeatured,
        isOrganic,
        status,
        slogan: fd.get("slogan") as string || null,
        ingredients: fd.get("ingredients") as string || null,
        nutritionalInfo: fd.get("nutritionalInfo") as string || null,
        manufacturedDetails: fd.get("manufacturedDetails") as string || null,
        barcode: fd.get("barcode") as string || null,
        mrp: fd.get("mrp") ? Number(fd.get("mrp")) : null,
      });
      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch(err) {
      toast.error("Failed to create product.");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button type="button" variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold">Add Product</h1>
          <p className="text-muted-foreground mt-1">Create a new product listing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">
            <h2 className="font-heading font-bold text-lg">General Information</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" required placeholder="e.g. Lakadong Turmeric Powder" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description *</Label>
              <Textarea id="desc" name="desc" required placeholder="Product details..." rows={4} className="rounded-xl" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">
            <h2 className="font-heading font-bold text-lg">Pricing & Inventory</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Base Price (₹) *</Label>
                <Input id="price" name="price" type="number" required placeholder="299" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" checked={onSale} onChange={e => setOnSale(e.target.checked)} className="rounded" />
                  Sale Price (₹)
                </Label>
                <Input name="salePrice" type="number" placeholder="249" className="rounded-xl" disabled={!onSale} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input id="stock" name="stock" required type="number" placeholder="100" className="rounded-xl" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-3">
                <Label htmlFor="weight">Weight *</Label>
                <Input id="weight" name="weight" required placeholder="e.g. 250g" className="rounded-xl max-w-[200px]" />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
            <h2 className="font-heading font-bold text-lg">Tags</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(t => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Type a tag and press Enter"
                className="rounded-xl"
              />
              <Button type="button" variant="outline" onClick={addTag} className="rounded-xl">Add</Button>
            </div>
          </div>\n
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">
            <h2 className="font-heading font-bold text-lg">Packaging & Label Details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slogan">Product Slogan</Label>
                <Input id="slogan" name="slogan"  placeholder="e.g. The Golden Spice of India" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea id="ingredients" name="ingredients"  placeholder="e.g. Organic turmeric, black pepper..." rows={2} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nutritionalInfo">Nutritional Information</Label>
                <Textarea id="nutritionalInfo" name="nutritionalInfo"  placeholder="e.g. Calories: 100kcal, Protein: 2g..." rows={2} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturedDetails">Manufacturing Details</Label>
                <Textarea id="manufacturedDetails" name="manufacturedDetails"  placeholder="e.g. Manufactured by Spicy Nuts, Humnabad..." rows={2} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode (Optional)</Label>
                  <Input id="barcode" name="barcode"  placeholder="8901234567890" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mrp">MRP (₹)</Label>
                  <Input id="mrp" name="mrp" type="number"  placeholder="350" className="rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
            <h2 className="font-heading font-bold text-lg">Status</h2>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm">
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
            <h2 className="font-heading font-bold text-lg">Organization</h2>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm">
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isOrganic} onChange={e => setIsOrganic(e.target.checked)} className="rounded" />
                <span className="text-sm">Organic Product</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="rounded" />
                <span className="text-sm">Featured Product</span>
              </label>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
            <h2 className="font-heading font-bold text-lg">Media</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageFile">Upload Image</Label>
                <Input id="imageFile" type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} className="rounded-xl cursor-pointer" />
                {isUploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
              </div>
              <div className="flex items-center gap-2 my-2">
                <hr className="flex-1" /><span className="text-xs text-muted-foreground">OR</span><hr className="flex-1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="rounded-xl" />
              </div>
            </div>
            <div className="aspect-square bg-muted rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground overflow-hidden">
              {imageUrl ? <Image width={800} height={800} unoptimized={false} src={imageUrl} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-sm">Image Preview</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-border/50 pt-6 mt-6">
        <Link href="/admin/products"><Button type="button" variant="outline" className="rounded-full">Cancel</Button></Link>
        <Button type="submit" disabled={isSaving} className="rounded-full shadow-md">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isSaving ? "Saving..." : "Save Product"}
        </Button>
      </div>
    </form>
  );
}
