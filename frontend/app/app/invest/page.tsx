import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import InvestLoading from './loading'

const InvestClient = dynamic(() => import('./InvestClient'), {
  suspense: true,
})

export default function InvestPage() {
  return (
    <Suspense fallback={<InvestLoading />}>
      <InvestClient />
    </Suspense>
  )
}
