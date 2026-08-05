"use client";

import { Printer } from "lucide-react";

/** Prints the invoice sheet; the `@media print` rules hide the admin chrome. */
export function InvoicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground md:h-9"
    >
      <Printer className="size-4" />
      Print
    </button>
  );
}
