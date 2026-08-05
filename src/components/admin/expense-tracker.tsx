"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, TriangleAlert } from "lucide-react";
import { centavosToInput, formatPeso, parsePesoToCentavos } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Expenses (MASTER-PLAN.md §5, task T2.3).
 *
 * The quick-add row is the whole point: amount, category, date, Save — three
 * fields that are always visible, with today and the last category already
 * filled in, so logging a receipt on a phone takes seconds. Everything else
 * (payee, description, payment method, receipt reference, links) hides behind
 * More details.
 *
 * Rows Hermes created from a receipt photo carry `needs_review`; they are
 * flagged and sorted to the top so nothing parsed by a machine is trusted
 * silently.
 */

export interface ExpenseRow extends Expense {
  created_at: string;
}

/** A product or order the expense can be linked to. */
export interface LinkOption {
  id: string;
  label: string;
}

const DEFAULT_CATEGORY = "product inventory";

// 16px on the fields typed every time: anything smaller makes iOS Safari zoom
// in on focus, which costs more seconds than the typing does.
const QUICK_FIELD =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus:border-ring focus:ring-3 focus:ring-ring/30";
const FIELD =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30";
const LABEL = "mb-1 block text-xs font-medium text-muted-foreground";
const AREA =
  "w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30";

interface Draft {
  amount: string;
  category: string;
  expense_date: string;
  payee: string;
  description: string;
  payment_method: string;
  receipt_reference: string;
  related_order_id: string;
  related_product_id: string;
  notes: string;
}

function blankDraft(date: string, category = DEFAULT_CATEGORY): Draft {
  return {
    amount: "",
    category,
    expense_date: date,
    payee: "",
    description: "",
    payment_method: "",
    receipt_reference: "",
    related_order_id: "",
    related_product_id: "",
    notes: "",
  };
}

function draftOf(row: ExpenseRow): Draft {
  return {
    amount: centavosToInput(Number(row.amount_centavos)),
    category: row.category,
    expense_date: row.expense_date,
    payee: row.payee ?? "",
    description: row.description ?? "",
    payment_method: row.payment_method ?? "",
    receipt_reference: row.receipt_reference ?? "",
    related_order_id: row.related_order_id ?? "",
    related_product_id: row.related_product_id ?? "",
    notes: row.notes ?? "",
  };
}

function text(value: string): string | null {
  return value.trim() || null;
}

/**
 * Draft → database row. Throws a message the owner can act on rather than
 * letting an unreadable amount be stored as zero.
 */
function toRow(draft: Draft) {
  const amount = parsePesoToCentavos(draft.amount);
  if (amount === null) {
    throw new Error("Enter the amount in pesos, like 731.01");
  }
  if (amount <= 0) {
    throw new Error("The amount has to be more than ₱0.00");
  }
  if (!draft.expense_date) throw new Error("Pick a date for this expense.");

  return {
    expense_date: draft.expense_date,
    category: draft.category,
    payee: text(draft.payee),
    description: text(draft.description),
    amount_centavos: amount,
    payment_method: text(draft.payment_method),
    receipt_reference: text(draft.receipt_reference),
    related_order_id: draft.related_order_id || null,
    related_product_id: draft.related_product_id || null,
    notes: text(draft.notes),
  };
}

function categoryOptions(current: string): string[] {
  // Keep whatever is already stored — a Hermes row could carry something the
  // list does not have, and a select must never silently rewrite it.
  return EXPENSE_CATEGORIES.includes(current as (typeof EXPENSE_CATEGORIES)[number])
    ? [...EXPENSE_CATEGORIES]
    : [...EXPENSE_CATEGORIES, current];
}

function monthLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(date);
}

function dayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(parsed);
}

export function ExpenseTracker({
  expenses,
  products,
  orders,
  today,
  loadError,
}: {
  expenses: ExpenseRow[];
  products: LinkOption[];
  orders: LinkOption[];
  today: string;
  loadError: string | null;
}) {
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>(() => blankDraft(today));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const [month, setMonth] = useState(today.slice(0, 7));
  const [editingId, setEditingId] = useState<string | null>(null);

  const months = useMemo(() => {
    const seen = new Set(expenses.map((row) => row.expense_date.slice(0, 7)));
    seen.add(today.slice(0, 7));
    // Keep the chosen month listed even before its first row arrives from the
    // server, otherwise the filter blanks out for a moment after an add.
    if (month !== "all") seen.add(month);
    return [...seen].sort().reverse();
  }, [expenses, today, month]);

  const visible = useMemo(
    () =>
      expenses
        .filter((row) => month === "all" || row.expense_date.startsWith(month))
        .sort(
          (a, b) =>
            Number(b.needs_review) - Number(a.needs_review) ||
            b.expense_date.localeCompare(a.expense_date) ||
            b.created_at.localeCompare(a.created_at),
        ),
    [expenses, month],
  );

  const total = visible.reduce(
    (running, row) => running + Number(row.amount_centavos || 0),
    0,
  );
  const reviewCount = visible.filter((row) => row.needs_review).length;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    setAddError(null);
    setAdded(null);
    try {
      const row = toRow(draft);
      const { error } = await createClient().from("expenses").insert(row);
      if (error) throw new Error(error.message);

      setAdded(formatPeso(row.amount_centavos));
      // Keep the category and date — a stack of receipts is entered in one go.
      setDraft(blankDraft(draft.expense_date, draft.category));
      setDetailsOpen(false);
      // Make sure the new row is inside whatever period is being shown.
      setMonth(row.expense_date.slice(0, 7));
      router.refresh();
    } catch (caught) {
      setAddError(
        caught instanceof Error ? caught.message : "Could not save that.",
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-base font-semibold tracking-tight">
          Expenses
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {expenses.length}
          </span>
        </h1>
      </div>

      <form
        onSubmit={add}
        className="space-y-2 rounded-lg border border-border bg-card p-3"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[9rem_1fr_11rem_auto] sm:items-end">
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL} htmlFor="amount">
              Amount ₱
            </label>
            <input
              id="amount"
              inputMode="decimal"
              required
              placeholder="0.00"
              value={draft.amount}
              onChange={(event) => {
                setAdded(null);
                setDraft({ ...draft, amount: event.target.value });
              }}
              className={QUICK_FIELD}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={draft.category}
              onChange={(event) =>
                setDraft({ ...draft, category: event.target.value })
              }
              className={QUICK_FIELD}
            >
              {categoryOptions(draft.category).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} htmlFor="date">
              Date
            </label>
            <input
              id="date"
              type="date"
              required
              value={draft.expense_date}
              onChange={(event) =>
                setDraft({ ...draft, expense_date: event.target.value })
              }
              className={QUICK_FIELD}
            />
          </div>

          <button
            type="submit"
            disabled={adding}
            className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50 sm:col-span-1"
          >
            {adding ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Save
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          className="flex h-11 items-center gap-1 text-xs text-muted-foreground sm:h-8"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform", detailsOpen && "rotate-180")}
          />
          More details
        </button>

        {detailsOpen ? (
          <DetailFields
            draft={draft}
            onChange={setDraft}
            products={products}
            orders={orders}
            idPrefix="add"
          />
        ) : null}

        {addError ? (
          <p className="rounded-md border border-destructive/40 p-2.5 text-sm text-destructive">
            {addError}
          </p>
        ) : null}
        {added ? (
          <p className="text-xs text-muted-foreground">Added {added}.</p>
        ) : null}
      </form>

      {loadError ? (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          Could not load expenses: {loadError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="month">
          Month
        </label>
        <select
          id="month"
          value={month}
          onChange={(event) => {
            setMonth(event.target.value);
            setEditingId(null);
          }}
          className="h-11 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-ring md:h-8"
        >
          {months.map((value) => (
            <option key={value} value={value}>
              {monthLabel(value)}
            </option>
          ))}
          <option value="all">All time</option>
        </select>

        <span className="text-xs text-muted-foreground">
          {visible.length} {visible.length === 1 ? "expense" : "expenses"}
        </span>

        <span className="ml-auto text-sm font-semibold tabular-nums">
          {formatPeso(total)}
        </span>
      </div>

      {reviewCount > 0 ? (
        <p className="rounded-lg border border-brand/40 bg-brand-soft/40 p-2.5 text-xs">
          {reviewCount} {reviewCount === 1 ? "expense needs" : "expenses need"} a
          quick check — they came from a receipt photo.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No expenses{month === "all" ? " yet" : ` in ${monthLabel(month)}`}.
        </p>
      ) : (
        <>
          <table className="hidden w-full border-separate border-spacing-0 text-sm md:table">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="sticky top-0 w-24 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Date
                </th>
                <th className="sticky top-0 w-48 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Category
                </th>
                <th className="sticky top-0 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Payee
                </th>
                <th className="sticky top-0 w-32 border-b border-border bg-background py-1.5 pr-2 text-right font-medium">
                  Amount
                </th>
                <th className="sticky top-0 w-16 border-b border-border bg-background py-1.5 font-medium">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) =>
                editingId === row.id ? (
                  <tr key={row.id}>
                    <td colSpan={5} className="border-b border-border py-2">
                      <ExpenseEditor
                        row={row}
                        products={products}
                        orders={orders}
                        onClose={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="border-b border-border py-1 pr-2 tabular-nums text-muted-foreground">
                      {dayLabel(row.expense_date)}
                    </td>
                    <td className="border-b border-border py-1 pr-2">
                      <span className="flex items-center gap-1.5">
                        {row.needs_review ? <ReviewBadge /> : null}
                        {row.category}
                      </span>
                    </td>
                    <td className="max-w-0 border-b border-border py-1 pr-2">
                      <div className="truncate">{row.payee ?? "—"}</div>
                      {row.description ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {row.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="border-b border-border py-1 pr-2 text-right tabular-nums">
                      {formatPeso(Number(row.amount_centavos || 0))}
                    </td>
                    <td className="border-b border-border py-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className="text-xs underline underline-offset-2"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          <ul className="space-y-2 md:hidden">
            {visible.map((row) => (
              <li key={row.id}>
                {editingId === row.id ? (
                  <div className="rounded-lg border border-border bg-card p-2">
                    <ExpenseEditor
                      row={row}
                      products={products}
                      orders={orders}
                      onClose={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingId(row.id)}
                    className="flex min-h-[52px] w-full flex-col justify-center gap-0.5 rounded-lg border border-border bg-card p-2.5 text-left"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {row.payee ?? row.category}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums">
                        {formatPeso(Number(row.amount_centavos || 0))}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {row.needs_review ? <ReviewBadge /> : null}
                      <span className="truncate">
                        {dayLabel(row.expense_date)} · {row.category}
                      </span>
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ReviewBadge() {
  return (
    <span className="shrink-0 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
      Review
    </span>
  );
}

function DetailFields({
  draft,
  onChange,
  products,
  orders,
  idPrefix,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  products: LinkOption[];
  orders: LinkOption[];
  idPrefix: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
      <div>
        <label className={LABEL} htmlFor={id("payee")}>
          Supplier or payee
        </label>
        <input
          id={id("payee")}
          value={draft.payee}
          onChange={(event) => onChange({ ...draft, payee: event.target.value })}
          className={FIELD}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor={id("method")}>
          Payment method
        </label>
        <input
          id={id("method")}
          placeholder="cash, gcash, card…"
          value={draft.payment_method}
          onChange={(event) =>
            onChange({ ...draft, payment_method: event.target.value })
          }
          className={FIELD}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={LABEL} htmlFor={id("description")}>
          Description
        </label>
        <input
          id={id("description")}
          value={draft.description}
          onChange={(event) =>
            onChange({ ...draft, description: event.target.value })
          }
          className={FIELD}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor={id("receipt")}>
          Receipt reference
        </label>
        <input
          id={id("receipt")}
          value={draft.receipt_reference}
          onChange={(event) =>
            onChange({ ...draft, receipt_reference: event.target.value })
          }
          className={FIELD}
        />
      </div>

      {products.length > 0 ? (
        <div>
          <label className={LABEL} htmlFor={id("product")}>
            Related product
          </label>
          <select
            id={id("product")}
            value={draft.related_product_id}
            onChange={(event) =>
              onChange({ ...draft, related_product_id: event.target.value })
            }
            className={FIELD}
          >
            <option value="">None</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div>
          <label className={LABEL} htmlFor={id("order")}>
            Related order
          </label>
          <select
            id={id("order")}
            value={draft.related_order_id}
            onChange={(event) =>
              onChange({ ...draft, related_order_id: event.target.value })
            }
            className={FIELD}
          >
            <option value="">None</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <label className={LABEL} htmlFor={id("notes")}>
          Notes
        </label>
        <textarea
          id={id("notes")}
          rows={2}
          value={draft.notes}
          onChange={(event) => onChange({ ...draft, notes: event.target.value })}
          className={AREA}
        />
      </div>
    </div>
  );
}

function ExpenseEditor({
  row,
  products,
  orders,
  onClose,
}: {
  row: ExpenseRow;
  products: LinkOption[];
  orders: LinkOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => draftOf(row));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = toRow(draft);
      const { error: updateError } = await createClient()
        .from("expenses")
        // Editing is the review: once it has been looked at, the flag goes.
        .update({ ...payload, needs_review: false })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
      onClose();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const { error: deleteError } = await createClient()
        .from("expenses")
        .delete()
        .eq("id", row.id);
      if (deleteError) throw new Error(deleteError.message);
      onClose();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[9rem_1fr_11rem]">
        <div className="col-span-2 sm:col-span-1">
          <label className={LABEL} htmlFor={`edit-amount-${row.id}`}>
            Amount ₱
          </label>
          <input
            id={`edit-amount-${row.id}`}
            inputMode="decimal"
            required
            value={draft.amount}
            onChange={(event) =>
              setDraft({ ...draft, amount: event.target.value })
            }
            className={QUICK_FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor={`edit-category-${row.id}`}>
            Category
          </label>
          <select
            id={`edit-category-${row.id}`}
            value={draft.category}
            onChange={(event) =>
              setDraft({ ...draft, category: event.target.value })
            }
            className={QUICK_FIELD}
          >
            {categoryOptions(draft.category).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor={`edit-date-${row.id}`}>
            Date
          </label>
          <input
            id={`edit-date-${row.id}`}
            type="date"
            required
            value={draft.expense_date}
            onChange={(event) =>
              setDraft({ ...draft, expense_date: event.target.value })
            }
            className={QUICK_FIELD}
          />
        </div>
      </div>

      <DetailFields
        draft={draft}
        onChange={setDraft}
        products={products}
        orders={orders}
        idPrefix={`edit-${row.id}`}
      />

      {error ? (
        <p className="rounded-md border border-destructive/40 p-2.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50 md:h-9"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-md border border-border px-3 text-sm md:h-9"
        >
          Cancel
        </button>

        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="ml-auto h-11 rounded-md bg-destructive/10 px-3 text-sm text-destructive disabled:opacity-50 md:h-9"
            >
              Confirm delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-11 px-2 text-sm text-muted-foreground md:h-9"
            >
              Keep it
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="ml-auto h-11 rounded-md border border-border px-3 text-sm text-muted-foreground md:h-9"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
