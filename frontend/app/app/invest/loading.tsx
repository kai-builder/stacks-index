export default function InvestLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-slate-800/50 rounded-lg w-48 mx-auto" />
        <div className="h-4 bg-slate-800/30 rounded w-64 mx-auto" />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column - Strategies */}
        <div className="lg:col-span-3 space-y-4">
          {/* Amount input skeleton */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="h-4 bg-slate-800/50 rounded w-24 mb-3" />
            <div className="h-12 bg-slate-800/30 rounded-xl" />
          </div>

          {/* Strategy cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/50" />
                  <div className="h-5 bg-slate-800/50 rounded w-24" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-800/50" />
                      <div className="h-3 bg-slate-800/30 rounded w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column - Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
            <div className="h-5 bg-slate-800/50 rounded w-32" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-slate-800/30 rounded w-20" />
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
