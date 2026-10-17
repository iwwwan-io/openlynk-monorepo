export default function OrderLoading() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
          <div className="mx-auto h-5 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-3/4 mx-auto rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="h-10 w-full rounded bg-slate-200 animate-pulse pt-2" />
        </div>
      </div>
    </main>
  );
}
