/** Placeholder for the Phase 2 screens (MASTER-PLAN.md §11, tasks T2.1–T2.5). */
export function ComingSoon({ title, what }: { title: string; what: string }) {
  return (
    <div className="space-y-3">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">Coming in Phase 2</p>
        <p className="mt-1 text-sm text-muted-foreground">{what}</p>
      </div>
    </div>
  );
}
