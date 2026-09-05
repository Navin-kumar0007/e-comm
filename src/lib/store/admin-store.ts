import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockProducts } from '@/lib/mock-data';

// ── Product type aligned with mock-data.ts ──
export type WeightOption = {
  weight: string;
  price: number;
};

export type NutritionInfo = {
  calories: number;
  protein: string;
  fat: string;
  carbs: string;
};

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  aiDescription?: string | null;
  price: string;
  salePrice: string | null;
  images: string[];
  categoryId: string;
  stock: number;
  weight: string;
  weightOptions: WeightOption[] | null;
  nutritionInfo: NutritionInfo | null;
  tags: string[];
  sustainabilityScore: number;
  isFeatured: boolean;
  isOrganic: boolean;
  status: ProductStatus;
};

// ── Order type ──
export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  weight: string;
};

export type Order = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: string;
  notes: string;
};

// ── Initial orders ──
const initialOrders: Order[] = [
  {
    id: 'MK-LXYZ12', customer: 'John Doe', email: 'john@example.com', phone: '+91 98765 43210',
    date: 'Aug 20, 2026', total: 748.0, status: 'Delivered',
    items: [
      { name: 'Lakadong Turmeric Powder', quantity: 2, price: 249, weight: '200g' },
      { name: 'Unpolished Toor Dal', quantity: 1, price: 250, weight: '1kg' }
    ],
    shippingAddress: '123 Main St, Apt 4B, New Delhi, 110001', notes: ''
  },
  {
    id: 'MK-ABCD34', customer: 'Jane Smith', email: 'jane@example.com', phone: '+91 87654 32109',
    date: 'Aug 21, 2026', total: 1249.0, status: 'Shipped',
    items: [
      { name: 'Kashmiri Saffron (Mogra)', quantity: 1, price: 1249, weight: '2g' }
    ],
    shippingAddress: '456 Oak Ave, Mumbai, 400001', notes: 'Gift wrap please'
  },
  {
    id: 'MK-EFGH56', customer: 'Alice Johnson', email: 'alice@example.com', phone: '+91 76543 21098',
    date: 'Aug 22, 2026', total: 450.0, status: 'Pending',
    items: [
      { name: 'Wood Pressed Groundnut Oil', quantity: 1, price: 450, weight: '1L' }
    ],
    shippingAddress: '789 Pine Rd, Bangalore, 560001', notes: ''
  },
  {
    id: 'MK-IJKL78', customer: 'Ravi Kumar', email: 'ravi@example.com', phone: '+91 65432 10987',
    date: 'Aug 23, 2026', total: 1590.0, status: 'Confirmed',
    items: [
      { name: 'Lakadong Turmeric Powder', quantity: 3, price: 249, weight: '200g' },
      { name: 'Kashmiri Saffron (Mogra)', quantity: 1, price: 1200, weight: '2g' }
    ],
    shippingAddress: '12 MG Road, Pune, 411001', notes: ''
  },
  {
    id: 'MK-MNOP90', customer: 'Priya Nair', email: 'priya@example.com', phone: '+91 54321 09876',
    date: 'Aug 24, 2026', total: 370.0, status: 'Pending',
    items: [
      { name: 'Unpolished Toor Dal', quantity: 2, price: 185, weight: '1kg' }
    ],
    shippingAddress: '45 Church Street, Chennai, 600001', notes: 'Leave at door'
  }
];

// ── Store settings ──
export type StoreSettings = {
  storeName: string;
  contactEmail: string;
  storeDescription: string;
  freeShippingThreshold: number;
  flatShippingRate: number;
  gstRate: number;
  currency: string;
};

const defaultSettings: StoreSettings = {
  storeName: "Nutty World",
  contactEmail: 'support@nuttyworld.com',
  storeDescription: 'Pure, Natural, Organic Indian Groceries',
  freeShippingThreshold: 999,
  flatShippingRate: 50,
  gstRate: 5,
  currency: 'INR',
};

// ── Admin state ──
interface AdminState {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;

  // Product actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStatus: (id: string) => void;
  updateStock: (id: string, newStock: number) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  bulkUpdateStatus: (ids: string[], status: ProductStatus) => void;

  // Order actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;

  // Settings actions
  updateSettings: (settings: Partial<StoreSettings>) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      products: mockProducts as unknown as Product[],
      orders: initialOrders,
      settings: defaultSettings,

      // ── Product actions ──
      addProduct: (product) => set((state) => ({
        products: [product, ...state.products]
      })),

      updateProduct: (id, updatedFields) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updatedFields } : p)
      })),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      toggleProductStatus: (id) => set((state) => ({
        products: state.products.map(p =>
          p.id === id
            ? { ...p, status: p.status === 'ACTIVE' ? 'DRAFT' as ProductStatus : 'ACTIVE' as ProductStatus }
            : p
        )
      })),

      updateStock: (id, newStock) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, stock: newStock } : p)
      })),

      bulkDeleteProducts: (ids) => set((state) => ({
        products: state.products.filter(p => !ids.includes(p.id))
      })),

      bulkUpdateStatus: (ids, status) => set((state) => ({
        products: state.products.map(p =>
          ids.includes(p.id) ? { ...p, status } : p
        )
      })),

      // ── Order actions ──
      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
      })),

      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })),

      deleteOrder: (id) => set((state) => ({
        orders: state.orders.filter(o => o.id !== id)
      })),

      // ── Settings actions ──
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'nuttyworld-admin-storage',
    }
  )
);

// ── Selector helpers (use outside of store to derive data) ──
export function getLowStockProducts(products: Product[], threshold = 20) {
  return products.filter(p => p.stock !== undefined && p.stock < threshold && p.status === 'ACTIVE');
}

export function getRevenueTotal(orders: Order[]) {
  return orders.reduce((sum, o) => sum + o.total, 0);
}
