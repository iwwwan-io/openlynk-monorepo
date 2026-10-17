export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Avatar & Header Skeleton */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="h-24 w-24 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-6 w-36 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
        </div>

        {/* Links Skeleton */}
        <div className="space-y-3">
          <div className="h-12 w-full rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
