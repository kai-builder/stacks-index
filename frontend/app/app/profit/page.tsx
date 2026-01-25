import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ProfitLoading from './loading'

const ProfitClient = dynamic(() => import('./ProfitClient'), {
  suspense: true,
})

export default function ProfitPage() {
  return (
    <Suspense fallback={<ProfitLoading />}>
      <ProfitClient />
    </Suspense>
  )
}
