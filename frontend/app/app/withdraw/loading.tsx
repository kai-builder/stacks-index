export default function WithdrawLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-slate-800/50 rounded-lg w-48 mx-auto" />
        <div className="h-4 bg-slate-800/30 rounded w-64 mx-auto" />
      </div>

      {/* Main card */}
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-6">
          {/* Token selector skeleton */}
          <div>
            <div className="h-4 bg-slate-800/50 rounded w-24 mb-3" />
            <div className="h-14 bg-slate-800/30 rounded-xl" />
          </div>

          {/* Amount input skeleton */}
          <div>
            <div className="h-4 bg-slate-800/50 rounded w-20 mb-3" />
            <div className="h-14 bg-slate-800/30 rounded-xl" />
          </div>

          {/* Address input skeleton */}
          <div>
            <div className="h-4 bg-slate-800/50 rounded w-36 mb-3" />
            <div className="h-14 bg-slate-800/30 rounded-xl" />
          </div>

          {/* Button skeleton */}
          <div className="h-12 bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
