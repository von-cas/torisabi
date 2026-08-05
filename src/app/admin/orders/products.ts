import type { PickerProduct } from "@/components/admin/order-items";
import { createClient } from "@/lib/supabase/server";

/**
 * Products offered by the order form's item picker. Drafts are included on
 * purpose — an item can be sold in a DM before it is published — and archived
 * ones are not. Cost comes along so it can be snapshotted onto the line item.
 */
export async function loadPickerProducts(): Promise<PickerProduct[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("id, code, name, price_centavos, cost_centavos")
      .is("archived_at", null)
      .order("code", { ascending: true });
    return (data ?? []) as PickerProduct[];
  } catch {
    return [];
  }
}
