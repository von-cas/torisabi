"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { centavosToInput, formatPeso, parsePesoToCentavos } from "@/lib/money";

/**
 * Line-item editor for an order.
 *
 * Picking a product SNAPSHOTS its name, code, price and cost onto the line. The
 * snapshot is the point: repricing or renaming a product later must not rewrite
 * what a past order was actually sold for, or the margin reports go wrong.
 * A line with no product behind it is allowed too — plenty of DM orders include
 * something that was never listed.
 */

export interface OrderLine {
  key: string;
  /** `order_items.id` once the row exists in the database; null while it is new. */
  id: string | null;
  product_id: string | null;
  product_name: string;
  product_code: string | null;
  /** Kept as typed so a half-finished entry is not fought by the input. */
  quantity: string;
  unit_price: string;
  /** Snapshot of the product's cost at the time of sale. Not edited here. */
  unit_cost_centavos: number | null;
}

export interface PickerProduct {
  id: string;
  code: string;
  name: string;
  price_centavos: number;
  cost_centavos: number | null;
}

const FIELD =
  "h-11 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-ring md:h-9";

function key() {
  return Math.random().toString(36).slice(2, 10);
}

export function blankLine(): OrderLine {
  return {
    key: key(),
    id: null,
    product_id: null,
    product_name: "",
    product_code: null,
    quantity: "1",
    unit_price: "",
    unit_cost_centavos: null,
  };
}

export function lineFromProduct(product: PickerProduct): OrderLine {
  return {
    key: key(),
    id: null,
    product_id: product.id,
    product_name: product.name,
    product_code: product.code,
    quantity: "1",
    unit_price: centavosToInput(product.price_centavos),
    unit_cost_centavos: product.cost_centavos,
  };
}

/** Whole centavos, or null while the quantity or price is not usable yet. */
export function parseLine(
  line: OrderLine,
): { quantity: number; unitPriceCentavos: number } | null {
  const quantity = Number.parseInt(line.quantity, 10);
  const unitPriceCentavos = parsePesoToCentavos(line.unit_price);
  if (!Number.isInteger(quantity) || quantity < 1) return null;
  if (unitPriceCentavos === null) return null;
  return { quantity, unitPriceCentavos };
}

export function lineTotalCentavos(line: OrderLine): number {
  const parsed = parseLine(line);
  return parsed ? parsed.quantity * parsed.unitPriceCentavos : 0;
}

export function productTotalCentavos(lines: OrderLine[]): number {
  return lines.reduce((total, line) => total + lineTotalCentavos(line), 0);
}

export function OrderItems({
  products,
  lines,
  onChange,
}: {
  products: PickerProduct[];
  lines: OrderLine[];
  onChange: (lines: OrderLine[]) => void;
}) {
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(needle) ||
            product.code.toLowerCase().includes(needle),
        )
        .slice(0, 8)
    : [];

  function update(lineKey: string, patch: Partial<OrderLine>) {
    onChange(
      lines.map((line) =>
        line.key === lineKey ? { ...line, ...patch } : line,
      ),
    );
  }

  function add(line: OrderLine) {
    onChange([...lines, line]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Items</span>
        <button
          type="button"
          onClick={() => add(blankLine())}
          className="flex h-11 items-center gap-1 rounded-md border border-border px-2.5 text-xs md:h-8"
        >
          <Plus className="size-3.5" />
          Free-text item
        </button>
      </div>

      <div>
        <label className="sr-only" htmlFor="product-search">
          Add a product
        </label>
        <input
          id="product-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Add a product — search by name or code"
          className={FIELD}
        />
        {needle ? (
          matches.length > 0 ? (
            <ul className="mt-1 overflow-hidden rounded-md border border-border">
              {matches.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      add(lineFromProduct(product));
                      setQuery("");
                    }}
                    className="flex min-h-11 w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{product.name}</span>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {product.code}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatPeso(Number(product.price_centavos || 0))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">
              No product matches that. Add a free-text item instead.
            </p>
          )
        ) : null}
      </div>

      {lines.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          No items yet — search for a product above.
        </p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line) => (
            <li key={line.key} className="rounded-md border border-border p-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <input
                    aria-label="Item name"
                    value={line.product_name}
                    placeholder="Item name"
                    onChange={(event) =>
                      update(line.key, { product_name: event.target.value })
                    }
                    className={FIELD}
                  />
                  {line.product_code ? (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {line.product_code}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${line.product_name || "item"}`}
                  onClick={() =>
                    onChange(lines.filter((other) => other.key !== line.key))
                  }
                  className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground md:size-9"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  aria-label="Quantity"
                  inputMode="numeric"
                  value={line.quantity}
                  onChange={(event) =>
                    update(line.key, { quantity: event.target.value })
                  }
                  className={`${FIELD} w-16 shrink-0 text-center`}
                />
                <span className="text-xs text-muted-foreground">×</span>
                <input
                  aria-label="Unit price in pesos"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={line.unit_price}
                  onChange={(event) =>
                    update(line.key, { unit_price: event.target.value })
                  }
                  className={`${FIELD} w-28 shrink-0`}
                />
                <span className="ml-auto text-sm tabular-nums">
                  {formatPeso(lineTotalCentavos(line))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
