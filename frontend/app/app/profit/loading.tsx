export default function ProfitLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-slate-800/50 rounded-lg w-40 mx-auto" />
        <div className="h-4 bg-slate-800/30 rounded w-56 mx-auto" />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column - Token list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="h-5 bg-slate-800/50 rounded w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800/50" />
                    <div>
                      <div className="h-4 bg-slate-800/50 rounded w-16 mb-1" />
                      <div className="h-3 bg-slate-800/30 rounded w-24" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-slate-800/50 rounded w-20 mb-1" />
                    <div className="h-3 bg-slate-800/30 rounded w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
            <div className="h-5 bg-slate-800/50 rounded w-28" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-slate-800/30 rounded w-24" />
                  <div className="h-4 bg-slate-800/30 rounded w-16" />
                </div>
              ))}
            </div>
            <div className="h-12 bg-slate-800/50 rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
