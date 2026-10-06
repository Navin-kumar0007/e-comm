"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

type Size = { id: string; label: string; price: number; salePrice: number | null; stock: number };

/** Size picker + price + add-to-cart for the product page. */
export function ProductPurchase({
  product,
  sizes,
}: {
  product: { id: string; name: string; slug: string; image: string; price: number; salePrice: number | null; stock: number; weight: string };
  sizes: Size[];
}) {
  const firstInStock = sizes.find((s) => s.stock > 0) ?? sizes[0];
  const [selectedId, setSelectedId] = useState(firstInStock?.id);
  const selected = sizes.find((s) => s.id === selectedId);

  const price = selected ? selected.salePrice ?? selected.price : product.salePrice ?? product.price;
  const regular = selected ? selected.price : product.price;
  const stock = selected ? selected.stock : product.stock;
  const weight = selected ? selected.label : product.weight;

  return (
    <>
      <div className="mb-4 space-y-4">
        <h3 className="font-medium text-foreground">{sizes.length > 1 ? "Select Pack Size" : "Pack Size"}</h3>
        <div className="flex flex-wrap gap-3">
          {sizes.length > 0 ? (
            sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                aria-pressed={s.id === selectedId}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  s.id === selectedId
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-foreground"
                } ${s.stock <= 0 ? "opacity-50 line-through" : ""}`}
              >
                {s.label} · ₹{s.salePrice ?? s.price}
              </button>
            ))
          ) : (
            <span className="px-4 py-2 rounded-full border border-primary bg-primary/10 text-primary text-sm font-medium">{product.weight}</span>
          )}
        </div>
        {sizes.length > 1 && (
          <p className="text-sm">
            <span className="text-xl font-bold text-primary">₹{price}</span>
            {price < regular && <span className="ml-2 text-muted-foreground line-through">₹{regular}</span>}
            <span className="ml-2 text-muted-foreground">for {weight}</span>
          </p>
        )}
        {stock > 0 && stock <= 5 && <p className="text-sm font-medium text-amber-600">Only {stock} left — order soon</p>}
        {stock <= 0 && <p className="text-sm font-medium text-destructive">Out of stock{sizes.length > 1 ? " in this size" : ""}</p>}
      </div>

      <AddToCartButton
        product={{ id: product.id, name: product.name, slug: product.slug, price, image: product.image, weight, variantId: selected?.id }}
        disabled={stock <= 0}
        size="lg"
        fullWidth
        className="text-lg h-14"
      />
    </>
  );
}
