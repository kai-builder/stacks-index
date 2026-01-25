export default function DepositLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-slate-800/50 rounded-lg w-40 mx-auto" />
        <div className="h-4 bg-slate-800/30 rounded w-56 mx-auto" />
      </div>

      {/* Main card */}
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-6">
          {/* Network selector skeleton */}
          <div>
            <div className="h-4 bg-slate-800/50 rounded w-28 mb-3" />
            <div className="h-14 bg-slate-800/30 rounded-xl" />
          </div>

          {/* Amount input skeleton */}
          <div>
            <div className="h-4 bg-slate-800/50 rounded w-20 mb-3" />
            <div className="h-14 bg-slate-800/30 rounded-xl" />
          </div>

          {/* Info box skeleton */}
          <div className="p-4 rounded-xl bg-slate-800/20 space-y-2">
            <div className="h-3 bg-slate-800/30 rounded w-full" />
            <div className="h-3 bg-slate-800/30 rounded w-3/4" />
          </div>

          {/* Button skeleton */}
          <div className="h-12 bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
