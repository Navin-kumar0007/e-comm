"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, X, Printer, Maximize2, SplitSquareHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateProductAction } from "@/app/actions/admin-products";
import Barcode from "@/components/ui/barcode";
import QRCode from "react-qr-code";

export default function EditProductForm({ product, categories, dietaryTags }: { product: any, categories: {id: string, name: string}[], dietaryTags: {id: string, name: string}[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"DETAILS" | "LABEL">("DETAILS");
  
  // General State
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(product.images && product.images.length > 0 ? product.images[0] : "");
  const [tags, setTags] = useState<string[]>(product.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [isOrganic, setIsOrganic] = useState(product.isOrganic);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [onSale, setOnSale] = useState(!!product.salePrice);
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">(product.status as "ACTIVE"|"DRAFT" || "ACTIVE");

  // Label Settings Parse
  let defaultLabelSettings = { brandColor: "#15803d", bgColor: "#ffffff", textColor: "#000000", width: 6, height: 4 };
  try {
    if (product.labelSettings) {
      defaultLabelSettings = JSON.parse(product.labelSettings);
    }
  } catch(e) {}

  // Label Editor State
  const [slogan, setSlogan] = useState(product.slogan || "");
  const [ingredients, setIngredients] = useState(product.ingredients || "");
  const [nutritionalInfo, setNutritionalInfo] = useState(product.nutritionalInfo || "");
  const [manufacturedDetails, setManufacturedDetails] = useState(product.manufacturedDetails || "");
  const [barcodeValue, setBarcodeValue] = useState(product.barcode || "");
  const [mrp, setMrp] = useState(product.mrp || "");
  
  const [labelBrandColor, setLabelBrandColor] = useState(defaultLabelSettings.brandColor);
  const [labelBgColor, setLabelBgColor] = useState(defaultLabelSettings.bgColor);
  const [labelTextColor, setLabelTextColor] = useState(defaultLabelSettings.textColor);
  const [labelWidth, setLabelWidth] = useState<number>(defaultLabelSettings.width);
  const [labelHeight, setLabelHeight] = useState<number>(defaultLabelSettings.height);

  const [batchNo, setBatchNo] = useState(`MK-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);
  const [mfgDate, setMfgDate] = useState(new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }));

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
      await updateProductAction(product.id, {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: fd.get("desc") as string,
        price: Number(fd.get("price")),
        salePrice: onSale ? Number(fd.get("salePrice")) : null,
        images: [imageUrl],
        categoryId: fd.get("category") as string,
        stock: Number(fd.get("stock")) || 0,
        weight: fd.get("weight") as string || "250g",
        tags,
        isFeatured,
        isOrganic,
        status,
        slogan,
        ingredients,
        nutritionalInfo,
        manufacturedDetails,
        barcode: barcodeValue || null,
        mrp: mrp ? Number(mrp) : null,
        labelSettings: {
          brandColor: labelBrandColor,
          bgColor: labelBgColor,
          textColor: labelTextColor,
          width: labelWidth,
          height: labelHeight
        }
      });
      toast.success("Product updated successfully!");
      setIsSaving(false);
    } catch(err) {
      toast.error("Failed to update product.");
      setIsSaving(false);
    }
  };

  const productUrl = `https://nuttyworld.com/shop/${product.slug}`;
  const finalBarcode = barcodeValue || product.id.slice(0, 12).toUpperCase();
  const formWeight = typeof window !== 'undefined' ? (document.getElementById('weight') as HTMLInputElement)?.value || product.weight || "250g" : "250g";
  const formPrice = typeof window !== 'undefined' ? (document.getElementById('price') as HTMLInputElement)?.value || product.price : product.price;

  return (
    <form onSubmit={handleSubmit} className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="ghost" size="icon" className="rounded-full bg-white shadow-sm"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Edit Product</h1>
            <p className="text-muted-foreground mt-1">Editing {product.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving} className="rounded-full shadow-md px-6">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 print:hidden mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("DETAILS")}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'DETAILS' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Product Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("LABEL")}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'LABEL' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Label Editor
        </button>
      </div>

      {/* TAB CONTENT: DETAILS */}
      <div className={activeTab === "DETAILS" ? "block print:hidden" : "hidden"}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-5">
              <h2 className="font-heading font-bold text-lg">General Information</h2>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" required defaultValue={product.name} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description *</Label>
                <Textarea id="desc" name="desc" required defaultValue={product.description} rows={4} className="rounded-xl" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-5">
              <h2 className="font-heading font-bold text-lg">Pricing & Inventory</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price (₹) *</Label>
                  <Input id="price" name="price" type="number" required defaultValue={product.price} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input type="checkbox" checked={onSale} onChange={e => setOnSale(e.target.checked)} className="rounded" />
                    Sale Price (₹)
                  </Label>
                  <Input name="salePrice" type="number" defaultValue={product.salePrice || ""} className="rounded-xl" disabled={!onSale} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input id="stock" name="stock" required type="number" defaultValue={product.stock} className="rounded-xl" />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-3">
                  <Label htmlFor="weight">Weight *</Label>
                  <Input id="weight" name="weight" required defaultValue={product.weight || "250g"} className="rounded-xl max-w-[200px]" />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-4">
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
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-4">
              <h2 className="font-heading font-bold text-lg">Status</h2>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm">
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-4">
              <h2 className="font-heading font-bold text-lg">Organization</h2>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" name="category" defaultValue={product.categoryId} className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm">
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

            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-4">
              <h2 className="font-heading font-bold text-lg">Media</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageFile">Upload Image</Label>
                  <Input id="imageFile" type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} className="rounded-xl cursor-pointer" />
                  {isUploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input id="image" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="rounded-xl" />
                </div>
              </div>
              <div className="aspect-square bg-muted rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-sm">Image Preview</span>}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* TAB CONTENT: LABEL EDITOR */}
      <div className={activeTab === "LABEL" ? "block" : "hidden"}>
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          
          {/* Label Content Form */}
          <div className="w-full xl:w-[450px] shrink-0 space-y-6 print:hidden">
            
            {/* Action Bar */}
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-primary">Advanced Custom Label</h3>
                  <p className="text-xs text-primary/70">Save changes to keep this design.</p>
               </div>
               <Button type="button" onClick={() => window.print()} className="gap-2 shadow-sm">
                 <Printer className="w-4 h-4" /> Print Sticker
               </Button>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-5">
              <h2 className="font-heading font-bold text-lg flex items-center justify-between">
                Design & Dimensions
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Maximize2 size={14} className="text-gray-500" /> Width (inches)</Label>
                  <Input type="number" step="0.5" value={labelWidth} onChange={e => setLabelWidth(Number(e.target.value))} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Maximize2 size={14} className="text-gray-500" /> Height (inches)</Label>
                  <Input type="number" step="0.5" value={labelHeight} onChange={e => setLabelHeight(Number(e.target.value))} className="rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <Label className="text-xs">Brand</Label>
                  <div className="flex gap-1 flex-col">
                    <Input type="color" value={labelBrandColor} onChange={e => setLabelBrandColor(e.target.value)} className="w-full h-8 p-1 cursor-pointer" />
                    <Input type="text" value={labelBrandColor} onChange={e => setLabelBrandColor(e.target.value)} className="font-mono text-[10px] uppercase h-6 px-1 text-center" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Background</Label>
                  <div className="flex gap-1 flex-col">
                    <Input type="color" value={labelBgColor} onChange={e => setLabelBgColor(e.target.value)} className="w-full h-8 p-1 cursor-pointer" />
                    <Input type="text" value={labelBgColor} onChange={e => setLabelBgColor(e.target.value)} className="font-mono text-[10px] uppercase h-6 px-1 text-center" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Text</Label>
                  <div className="flex gap-1 flex-col">
                    <Input type="color" value={labelTextColor} onChange={e => setLabelTextColor(e.target.value)} className="w-full h-8 p-1 cursor-pointer" />
                    <Input type="text" value={labelTextColor} onChange={e => setLabelTextColor(e.target.value)} className="font-mono text-[10px] uppercase h-6 px-1 text-center" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-5">
              <h2 className="font-heading font-bold text-lg">Label Content</h2>
              
              <div className="space-y-2">
                <Label>Product Slogan</Label>
                <Input value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="e.g. The Golden Spice of India" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Ingredients</Label>
                <Textarea value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="e.g. Organic turmeric, black pepper..." rows={2} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Nutritional Information</Label>
                <Textarea value={nutritionalInfo} onChange={e => setNutritionalInfo(e.target.value)} placeholder="e.g. Calories: 100kcal, Protein: 2g..." rows={2} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Manufacturing Details</Label>
                <Textarea value={manufacturedDetails} onChange={e => setManufacturedDetails(e.target.value)} placeholder="e.g. Manufactured by Spicy Nuts..." rows={2} className="rounded-xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Barcode (Optional)</Label>
                  <Input value={barcodeValue} onChange={e => setBarcodeValue(e.target.value)} placeholder="Leave blank to auto-generate" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>MRP (₹)</Label>
                  <Input type="number" value={mrp} onChange={e => setMrp(e.target.value)} placeholder="350" className="rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <Label className="text-gray-500">Batch Number (Print)</Label>
                  <Input value={batchNo} onChange={e => setBatchNo(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Mfg Date (Print)</Label>
                  <Input value={mfgDate} onChange={e => setMfgDate(e.target.value)} className="rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview / Printable Area */}
          <div className="w-full flex-1 flex justify-center sticky top-8 print:static overflow-auto p-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl print:p-0 print:border-none print:bg-transparent min-h-[600px] print:min-h-0">
            
            <div 
              className="shadow-2xl print:shadow-none flex relative overflow-hidden transition-all duration-300 mx-auto bg-white"
              style={{ 
                width: `${labelWidth}in`, 
                height: `${labelHeight}in`,
                backgroundColor: labelBgColor, 
                color: labelTextColor, 
                WebkitPrintColorAdjust: 'exact', 
                printColorAdjust: 'exact',
                border: '1px solid #e5e7eb', // subtle border for web view
              }}
            >
              {/* === FRONT PANEL === */}
              <div className="flex-[0.5] flex flex-col items-center justify-center text-center p-6 border-r border-black/10 shrink-0 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: labelBrandColor }}></div>
                <div className="absolute bottom-0 inset-x-0 h-2" style={{ backgroundColor: labelBrandColor }}></div>
                
                <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase opacity-80" style={{ color: labelBrandColor }}>
                  Spicy Nuts
                  <br/>
                  <span className="text-base tracking-[0.3em]">Kitchen</span>
                </h1>
                
                <div className="my-6 space-y-1">
                  <h2 className="text-2xl md:text-3xl font-black leading-tight uppercase tracking-tight break-words px-2">
                    {typeof window !== 'undefined' ? (document.getElementById('name') as HTMLInputElement)?.value || product.name : product.name}
                  </h2>
                  {slogan && <p className="text-xs md:text-sm font-medium italic opacity-70 px-4">{slogan}</p>}
                </div>

                <div className="mt-2 flex flex-col items-center gap-3">
                  <span className="text-lg md:text-xl font-bold px-4 py-1.5 rounded-full shadow-sm tracking-wide uppercase transition-colors duration-300" style={{ backgroundColor: labelBrandColor, color: '#ffffff' }}>
                    {formWeight}
                  </span>
                  
                  <div className="flex items-center gap-3 bg-white/50 px-3 py-1.5 rounded-full border border-black/5 mt-2">
                    <div className="w-5 h-5 border-2 p-[2px] shrink-0" style={{ borderColor: '#15803d' }}>
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: '#15803d' }}></div>
                    </div>
                    {isOrganic && (
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#15803d' }}>
                        100% Organic
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* === BACK PANEL === */}
              <div className="flex-[0.5] flex flex-col p-5 md:p-6 shrink-0 relative text-[10px] md:text-xs">
                
                {/* Upper Details */}
                <div className="flex-1 space-y-4 pr-2">
                  {ingredients && (
                    <div>
                      <strong className="uppercase block mb-1 text-[11px] md:text-xs tracking-wider" style={{ color: labelBrandColor }}>Ingredients</strong>
                      <p className="font-medium opacity-80 leading-relaxed">{ingredients}</p>
                    </div>
                  )}
                  
                  {nutritionalInfo && (
                    <div>
                      <strong className="uppercase block mb-1 text-[11px] md:text-xs tracking-wider" style={{ color: labelBrandColor }}>Nutrition Facts</strong>
                      <p className="font-medium opacity-80 leading-relaxed whitespace-pre-wrap">{nutritionalInfo}</p>
                    </div>
                  )}
                  
                  <div>
                    <strong className="uppercase block mb-1 text-[11px] md:text-xs tracking-wider" style={{ color: labelBrandColor }}>Manufacturing</strong>
                    <p className="font-medium opacity-80 leading-relaxed">{manufacturedDetails || "Manufactured & Marketed by Spicy Nuts, Humnabad, Chittaguppa, Karnataka, 585412"}</p>
                    <div className="flex items-center gap-2 mt-2 font-mono text-[9px] md:text-[10px] bg-black/5 inline-block px-2 py-0.5 rounded">
                      <strong className="font-bold opacity-70">FSSAI:</strong>
                      <span className="font-bold">112XXXXXXXXXXX</span>
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & Barcode */}
                <div className="mt-4 pt-4 border-t border-black/10 flex flex-col shrink-0 gap-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1.5">
                      {mrp && (
                        <p className="text-base md:text-lg font-black uppercase tracking-tight">MRP: ₹{mrp} <span className="text-[8px] md:text-[9px] font-bold opacity-50 block -mt-1 leading-none">(INCL. TAXES)</span></p>
                      )}
                      {!mrp && formPrice && (
                        <p className="text-base md:text-lg font-black uppercase tracking-tight">MRP: ₹{formPrice} <span className="text-[8px] md:text-[9px] font-bold opacity-50 block -mt-1 leading-none">(INCL. TAXES)</span></p>
                      )}
                      <div className="flex flex-col gap-0.5 mt-2 opacity-80">
                        <p className="text-[9px] font-bold uppercase tracking-wider">Batch: <span className="font-semibold">{batchNo}</span></p>
                        <p className="text-[9px] font-bold uppercase tracking-wider">Mfg: <span className="font-semibold">{mfgDate}</span></p>
                        <p className="text-[8px] mt-1 font-medium opacity-80">Best before 12 months</p>
                      </div>
                    </div>
                    
                    <div className="shrink-0 p-1.5 bg-white rounded-lg shadow-sm border border-black/5 ml-2">
                      <QRCode value={productUrl} size={48} level="L" bgColor="#ffffff" fgColor="#000000" />
                    </div>
                  </div>
                  
                  <div className="flex justify-center bg-white p-2 rounded-lg border border-black/5 shadow-sm mt-1">
                    <Barcode 
                      value={finalBarcode} 
                      width={1.5} 
                      height={32} 
                      fontSize={10} 
                      margin={0} 
                      displayValue={true} 
                      background="#ffffff"
                      lineColor="#000000"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </form>
  );
}
