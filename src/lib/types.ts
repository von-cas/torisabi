/**
 * Shared types mirroring supabase/migrations/0001_init.sql.
 * Every *_centavos field is an integer number of centavos.
 */

export type ProductStatus =
  | "draft"
  | "available"
  | "limited"
  | "reserved"
  | "sold_out";

export type OrderStatus =
  | "inquiry"
  | "awaiting_confirmation"
  | "reserved"
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentState = "unpaid" | "partial" | "paid" | "refunded";

/** Statuses a visitor can see. `draft` is admin-only by construction. */
export const PUBLIC_STATUSES = [
  "available",
  "limited",
  "reserved",
  "sold_out",
] as const satisfies readonly ProductStatus[];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  available: "Available",
  limited: "Limited Stock",
  reserved: "Reserved",
  sold_out: "Sold",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  inquiry: "Inquiry",
  awaiting_confirmation: "Awaiting Confirmation",
  reserved: "Reserved",
  awaiting_payment: "Awaiting Payment",
  paid: "Paid",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const EXPENSE_CATEGORIES = [
  "product inventory",
  "packaging",
  "shipping",
  "advertising",
  "website and domain",
  "supplies",
  "transportation",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** A product as the public site sees it — no cost price. Mirrors `public_products`. */
export interface PublicProduct {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  price_centavos: number;
  discounted_price_centavos: number | null;
  variations: string[];
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

/** A product as the admin sees it — includes cost and archive state. */
export interface AdminProduct extends PublicProduct {
  cost_centavos: number | null;
  source: "manual" | "hermes";
  archived_at: string | null;
}

export interface ProductPhoto {
  id: string;
  product_id: string;
  display_path: string;
  thumb_path: string;
  alt_text: string | null;
  sort_order: number;
}

export type ProductWithPhotos<T extends PublicProduct = PublicProduct> = T & {
  photos: ProductPhoto[];
};

export interface Order {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  instagram_username: string | null;
  mobile_number: string | null;
  product_total_centavos: number;
  shipping_fee_centavos: number;
  discount_centavos: number;
  final_amount_centavos: number;
  payment_method: string | null;
  payment_state: PaymentState;
  delivery_address: string | null;
  courier: string | null;
  tracking_number: string | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string | null;
  quantity: number;
  unit_price_centavos: number;
  unit_cost_centavos: number | null;
  line_total_centavos: number;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  payee: string | null;
  description: string | null;
  amount_centavos: number;
  payment_method: string | null;
  receipt_reference: string | null;
  related_order_id: string | null;
  related_product_id: string | null;
  source: "manual" | "hermes";
  needs_review: boolean;
  notes: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  invoice_date: string;
  notes: string | null;
}

/** A product is orderable unless it has been sold. */
export function isOrderable(status: ProductStatus): boolean {
  return status === "available" || status === "limited";
}
