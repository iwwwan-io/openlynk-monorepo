export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-64 rounded bg-slate-200 animate-pulse" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-32 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
    </div>
  );
}
