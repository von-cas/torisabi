import {
  ProductTable,
  type AdminProductRow,
} from "@/components/admin/product-table";
import { PHOTO_BUCKET } from "@/components/admin/photos";
import { createClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  code: string;
  name: string;
  category: string | null;
  price_centavos: number;
  discounted_price_centavos: number | null;
  status: ProductStatus;
  created_at: string;
}

async function loadProducts(): Promise<{
  products: AdminProductRow[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, code, name, category, price_centavos, discounted_price_centavos, status, created_at",
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) return { products: [], error: error.message };

    const rows = (data ?? []) as Row[];
    if (rows.length === 0) return { products: [], error: null };

    const { data: photos } = await supabase
      .from("product_photos")
      .select("product_id, thumb_path, sort_order")
      .in(
        "product_id",
        rows.map((row) => row.id),
      )
      .order("sort_order", { ascending: true });

    const firstThumb = new Map<string, string>();
    for (const photo of (photos ?? []) as {
      product_id: string;
      thumb_path: string;
    }[]) {
      if (!firstThumb.has(photo.product_id)) {
        firstThumb.set(photo.product_id, photo.thumb_path);
      }
    }

    return {
      products: rows.map((row) => {
        const thumb = firstThumb.get(row.id);
        return {
          ...row,
          thumbUrl: thumb
            ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(thumb).data
                .publicUrl
            : null,
        };
      }),
      error: null,
    };
  } catch {
    return { products: [], error: "the database is not configured yet" };
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ products, error }, params] = await Promise.all([
    loadProducts(),
    searchParams,
  ]);
  const filter = params.filter === "draft" ? "draft" : "all";

  return (
    // Keyed so arriving from the dashboard's "Drafts to review" tile always
    // starts on the right filter instead of reusing the previous state.
    <ProductTable
      key={filter}
      products={products}
      loadError={error}
      initialFilter={filter}
    />
  );
}
