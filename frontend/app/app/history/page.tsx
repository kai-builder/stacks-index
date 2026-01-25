import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import HistoryLoading from './loading'

const HistoryClient = dynamic(() => import('./HistoryClient'), {
  suspense: true,
})

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryLoading />}>
      <HistoryClient />
    </Suspense>
  )
}
