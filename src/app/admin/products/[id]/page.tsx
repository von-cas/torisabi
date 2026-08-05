import Link from "next/link";
import { PHOTO_BUCKET } from "@/components/admin/photos";
import { ProductForm } from "@/components/admin/product-form";
import type { AdminPhoto } from "@/components/admin/product-photos";
import { createClient } from "@/lib/supabase/server";
import type { AdminProduct, ProductPhoto } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadProduct(id: string): Promise<{
  product: AdminProduct | null;
  photos: AdminPhoto[];
}> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) return { product: null, photos: [] };

    const { data: photoRows } = await supabase
      .from("product_photos")
      .select("*")
      .eq("product_id", id)
      .order("sort_order", { ascending: true });

    const photos = ((photoRows ?? []) as ProductPhoto[]).map((photo) => ({
      ...photo,
      thumbUrl: supabase.storage.from(PHOTO_BUCKET).getPublicUrl(photo.thumb_path)
        .data.publicUrl,
    }));

    return { product: data as AdminProduct, photos };
  } catch {
    return { product: null, photos: [] };
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product, photos } = await loadProduct(id);

  if (!product) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        This product could not be loaded.{" "}
        <Link href="/admin/products" className="underline">
          Back to products
        </Link>
        .
      </div>
    );
  }

  return <ProductForm product={product} photos={photos} />;
}
