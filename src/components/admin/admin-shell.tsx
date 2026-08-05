"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChartColumn,
  Ellipsis,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Compact admin chrome (MASTER-PLAN.md §5): slim icon sidebar on desktop,
 * fixed bottom tab bar on phones. Every tap target is at least 44px tall.
 */

const LOGIN_PATH = "/admin/login";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/reports", label: "Reports", icon: ChartColumn },
];

// Phones get the four working areas plus More; the dashboard lives behind More.
const TABS = NAV.slice(1);

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  async function signOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      // Nothing to sign out of — fall through to the login screen anyway.
    }
    setMoreOpen(false);
    router.replace("/admin/login");
    router.refresh();
  }

  // The login screen is its own full-height page — no nav around it.
  if (pathname === LOGIN_PATH) return <>{children}</>;

  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-svh w-16 shrink-0 flex-col border-r border-border bg-card md:flex lg:w-48">
        <div className="flex h-12 shrink-0 items-center justify-center border-b border-border lg:justify-start lg:px-3">
          <span className="text-sm font-semibold tracking-tight lg:hidden">
            TS
          </span>
          <span className="hidden text-sm font-semibold tracking-tight lg:inline">
            Torisabi admin
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-1.5">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "flex h-11 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground justify-center lg:justify-start",
                  active && "bg-muted font-medium text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={signOut}
          className="m-1.5 flex h-11 items-center justify-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:justify-start"
          title="Sign out"
        >
          <LogOut className="size-4 shrink-0" />
          <span className="hidden lg:inline">Sign out</span>
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-3 pb-24 md:p-4 md:pb-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {TABS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground",
                active && "font-medium text-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          className={cn(
            "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground",
            moreOpen && "font-medium text-foreground",
          )}
        >
          <Ellipsis className="size-5" />
          More
        </button>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-foreground/20"
          />
          <div className="absolute inset-x-0 bottom-14 border-t border-border bg-card p-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)]">
            <Link
              href="/admin"
              onClick={() => setMoreOpen(false)}
              className="flex h-12 items-center gap-2.5 rounded-md px-3 text-sm hover:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex h-12 w-full items-center gap-2.5 rounded-md px-3 text-sm hover:bg-muted"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
