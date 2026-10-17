export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-xs font-medium text-slate-500 animate-pulse">Memuat halaman...</p>
      </div>
    </div>
  );
}
