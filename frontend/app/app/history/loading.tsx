'use client'

import { Loader2 } from 'lucide-react'

export default function HistoryLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-slate-400 text-sm">Loading history...</p>
    </div>
  )
}
