"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { centavosToInput, formatPeso, parsePesoToCentavos } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
  type PaymentState,
} from "@/lib/types";
import {
  OrderItems,
  parseLine,
  productTotalCentavos,
  type OrderLine,
  type PickerProduct,
} from "./order-items";
import {
  PAYMENT_METHODS,
  PAYMENT_STATES,
  PAYMENT_STATE_LABELS,
  manilaToday,
} from "./order-shared";

/**
 * Create/edit an order (MASTER-PLAN.md §5).
 *
 * `order_number` comes from a database sequence and `final_amount_centavos` is a
 * generated column — neither is ever sent from here. What this form does write is
 * `product_total_centavos`, the sum of the line items, in whole centavos.
 *
 * On edit the item rows are reconciled (removed / added / changed) instead of
 * being wiped and re-inserted, so untouched lines keep their identity.
 */

const FIELD =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30";
const AREA =
  "w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30";
const LABEL = "mb-1 block text-xs font-medium text-muted-foreground";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

interface ItemRow {
  id: string;
  product_id: string | null;
  product_name: string;
  product_code: string | null;
  quantity: number;
  unit_price_centavos: number;
  unit_cost_centavos: number | null;
}

/** The item fields that live in the database — what a reconcile compares. */
type ItemFields = Omit<ItemRow, "id">;

function toLines(rows: ItemRow[]): OrderLine[] {
  return rows.map((row) => ({
    key: row.id,
    id: row.id,
    product_id: row.product_id,
    product_name: row.product_name,
    product_code: row.product_code,
    quantity: String(row.quantity),
    unit_price: centavosToInput(row.unit_price_centavos),
    unit_cost_centavos: row.unit_cost_centavos,
  }));
}

function toSaved(rows: ItemRow[]): Record<string, ItemFields> {
  return Object.fromEntries(
    rows.map(({ id, ...fields }) => [id, fields]),
  ) as Record<string, ItemFields>;
}

function fieldsOf(line: OrderLine): ItemFields {
  const parsed = parseLine(line);
  if (!parsed) {
    throw new Error(
      `Check the quantity and price on “${line.product_name || "the new item"}”.`,
    );
  }
  return {
    product_id: line.product_id,
    product_name: line.product_name.trim(),
    product_code: line.product_code,
    quantity: parsed.quantity,
    unit_price_centavos: parsed.unitPriceCentavos,
    unit_cost_centavos: line.unit_cost_centavos,
  };
}

function sameFields(a: ItemFields, b: ItemFields) {
  return (
    a.product_id === b.product_id &&
    a.product_name === b.product_name &&
    a.product_code === b.product_code &&
    a.quantity === b.quantity &&
    a.unit_price_centavos === b.unit_price_centavos &&
    a.unit_cost_centavos === b.unit_cost_centavos
  );
}

/** Pesos typed into an optional money field → centavos. Blank counts as zero. */
function optionalCentavos(input: string, label: string): number {
  if (!input.trim()) return 0;
  const centavos = parsePesoToCentavos(input);
  if (centavos === null) throw new Error(`The ${label} is not a valid amount.`);
  return centavos;
}

export function OrderForm({
  order,
  items = [],
  products,
}: {
  order?: Order;
  items?: ItemRow[];
  products: PickerProduct[];
}) {
  const router = useRouter();
  const editing = Boolean(order);

  const [customerName, setCustomerName] = useState(order?.customer_name ?? "");
  const [instagram, setInstagram] = useState(order?.instagram_username ?? "");
  const [mobile, setMobile] = useState(order?.mobile_number ?? "");
  const [orderDate, setOrderDate] = useState(
    order?.order_date ?? manilaToday(),
  );
  const [address, setAddress] = useState(order?.delivery_address ?? "");
  const [courier, setCourier] = useState(order?.courier ?? "");
  const [tracking, setTracking] = useState(order?.tracking_number ?? "");
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [shipping, setShipping] = useState(
    centavosToInput(order?.shipping_fee_centavos),
  );
  const [discount, setDiscount] = useState(
    centavosToInput(order?.discount_centavos),
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "inquiry");
  const [paymentState, setPaymentState] = useState<PaymentState>(
    order?.payment_state ?? "unpaid",
  );
  const [paymentMethod, setPaymentMethod] = useState(
    order?.payment_method ?? "",
  );

  const [lines, setLines] = useState<OrderLine[]>(() => toLines(items));
  const [saved, setSaved] = useState<Record<string, ItemFields>>(() =>
    toSaved(items),
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Preview only. The stored final amount is generated by the database from the
  // same three numbers, so the two cannot drift.
  const productTotal = productTotalCentavos(lines);
  const shippingPreview = parsePesoToCentavos(shipping || "0") ?? 0;
  const discountPreview = parsePesoToCentavos(discount || "0") ?? 0;
  const finalPreview = productTotal + shippingPreview - discountPreview;

  function orderPayload() {
    const name = customerName.trim();
    if (!name) throw new Error("The customer's name is required.");
    if (lines.length === 0) throw new Error("Add at least one item.");
    if (lines.some((line) => !line.product_name.trim())) {
      throw new Error("Every item needs a name.");
    }

    const itemFields = lines.map(fieldsOf);
    const total = itemFields.reduce(
      (running, item) => running + item.quantity * item.unit_price_centavos,
      0,
    );
    const shippingFee = optionalCentavos(shipping, "shipping fee");
    const discountAmount = optionalCentavos(discount, "discount");
    if (discountAmount > total + shippingFee) {
      throw new Error("The discount is larger than the order total.");
    }

    return {
      itemFields,
      order: {
        order_date: orderDate,
        customer_name: name,
        instagram_username: instagram.trim() || null,
        mobile_number: mobile.trim() || null,
        product_total_centavos: total,
        shipping_fee_centavos: shippingFee,
        discount_centavos: discountAmount,
        payment_method: paymentMethod || null,
        payment_state: paymentState,
        delivery_address: address.trim() || null,
        courier: courier.trim() || null,
        tracking_number: tracking.trim() || null,
        status,
        notes: notes.trim() || null,
      },
    };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setJustSaved(false);
    try {
      const payload = orderPayload();
      const supabase = createClient();

      if (!order) {
        const { data, error: insertError } = await supabase
          .from("orders")
          .insert(payload.order)
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);

        const id = (data as { id: string }).id;
        const { error: itemsError } = await supabase.from("order_items").insert(
          payload.itemFields.map((item) => ({ ...item, order_id: id })),
        );
        if (itemsError) {
          // The order row exists — send them to it rather than letting a retry
          // here create a second one.
          setCreatedId(id);
          throw new Error(
            `The order was saved but its items were not: ${itemsError.message}`,
          );
        }

        router.push(`/admin/orders/${id}`);
        router.refresh();
        return;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(payload.order)
        .eq("id", order.id);
      if (updateError) throw new Error(updateError.message);

      // Reconcile the item rows rather than wiping and re-inserting them.
      const keptIds = new Set(
        lines.map((line) => line.id).filter((id): id is string => Boolean(id)),
      );
      const removed = Object.keys(saved).filter((id) => !keptIds.has(id));
      if (removed.length > 0) {
        const { error: deleteError } = await supabase
          .from("order_items")
          .delete()
          .in("id", removed);
        if (deleteError) throw new Error(deleteError.message);
      }

      const added = lines
        .map((line, index) => ({ line, fields: payload.itemFields[index] }))
        .filter(({ line }) => !line.id);
      if (added.length > 0) {
        const { error: insertError } = await supabase
          .from("order_items")
          .insert(
            added.map(({ fields }) => ({ ...fields, order_id: order.id })),
          );
        if (insertError) throw new Error(insertError.message);
      }

      for (const [index, line] of lines.entries()) {
        const fields = payload.itemFields[index];
        const before = line.id ? saved[line.id] : undefined;
        if (!line.id || !before || sameFields(before, fields)) continue;
        const { error: itemError } = await supabase
          .from("order_items")
          .update(fields)
          .eq("id", line.id);
        if (itemError) throw new Error(itemError.message);
      }

      // Re-read so newly inserted rows carry their database ids and a second
      // save reconciles against what is really stored.
      const { data: rows } = await supabase
        .from("order_items")
        .select(
          "id, product_id, product_name, product_code, quantity, unit_price_centavos, unit_cost_centavos",
        )
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });
      const fresh = (rows ?? []) as ItemRow[];
      setLines(toLines(fresh));
      setSaved(toSaved(fresh));

      setJustSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-base font-semibold tracking-tight">
          {editing ? `Order ${order?.order_number}` : "New order"}
        </h1>
        <Link
          href="/admin/orders"
          className="flex h-11 items-center rounded-md border border-border px-3 text-sm md:h-9"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50 md:h-9"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {editing ? "Save" : "Create order"}
        </button>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="customer">
            Customer name
          </label>
          <input
            id="customer"
            required
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="order-date">
            Order date
          </label>
          <input
            id="order-date"
            type="date"
            required
            value={orderDate}
            onChange={(event) => setOrderDate(event.target.value)}
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="instagram">
            Instagram username
          </label>
          <input
            id="instagram"
            placeholder="@name"
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="mobile">
            Mobile number
          </label>
          <input
            id="mobile"
            inputMode="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            className={FIELD}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="address">
            Delivery address
          </label>
          <textarea
            id="address"
            rows={3}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={AREA}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="courier">
            Courier
          </label>
          <input
            id="courier"
            value={courier}
            onChange={(event) => setCourier(event.target.value)}
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="tracking">
            Tracking number
          </label>
          <input
            id="tracking"
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-3">
        <OrderItems products={products} lines={lines} onChange={setLines} />

        <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="shipping">
              Shipping fee ₱
            </label>
            <input
              id="shipping"
              inputMode="decimal"
              placeholder="0.00"
              value={shipping}
              onChange={(event) => setShipping(event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="discount">
              Discount ₱
            </label>
            <input
              id="discount"
              inputMode="decimal"
              placeholder="0.00"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              className={FIELD}
            />
          </div>
        </div>

        <dl className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Product total</dt>
            <dd className="tabular-nums">{formatPeso(productTotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="tabular-nums">{formatPeso(shippingPreview)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="tabular-nums">−{formatPeso(discountPreview)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-1 font-semibold">
            <dt>Final amount</dt>
            <dd className="tabular-nums">{formatPeso(finalPreview)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
            className={FIELD}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="payment-method">
            Payment method
          </label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className={FIELD}
          >
            <option value="">Not set</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="payment-state">
            Payment
          </label>
          <select
            id="payment-state"
            value={paymentState}
            onChange={(event) =>
              setPaymentState(event.target.value as PaymentState)
            }
            className={FIELD}
          >
            {PAYMENT_STATES.map((value) => (
              <option key={value} value={value}>
                {PAYMENT_STATE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className={LABEL} htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={AREA}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 p-2.5 text-sm text-destructive">
          {error}
          {createdId ? (
            <>
              {" "}
              <Link href={`/admin/orders/${createdId}`} className="underline">
                Open the order and add the items there
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}
      {justSaved ? (
        <p className="text-sm text-muted-foreground">Saved.</p>
      ) : null}
    </form>
  );
}
