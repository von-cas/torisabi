import { OrderForm } from "@/components/admin/order-form";
import { loadPickerProducts } from "../products";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const products = await loadPickerProducts();
  return <OrderForm products={products} />;
}
