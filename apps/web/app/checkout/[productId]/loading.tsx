export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-3 pt-4">
            <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
            <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
            <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
