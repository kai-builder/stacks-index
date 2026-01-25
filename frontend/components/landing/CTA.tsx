'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useWalletStore } from '@/lib/store/wallet'

export function CTA() {
  const { isConnected } = useWalletStore()

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
          Start Today
        </span>

        {/* Headline */}
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          Ready to invest in{' '}
          <span className="text-gradient">Stacks Eco</span>?
        </h2>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Turn your USDCx into a diversified Stacks portfolio with one click.
          No minimums. No lock-ups
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isConnected ? (
            <Button size="lg" className="btn-shine px-8" asChild>
              <Link href="/app/invest">
                Invest Your USDCx
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          ) : (
            <WalletButton />
          )}
          <Button variant="secondary" size="lg" asChild>
            <a
              href="https://bridge.stacks.co/usdc/eth/stx"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get USDCx via Bridge
            </a>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z"/>
            </svg>
            Non-custodial
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6.3 1 .9 1 1.5V15c0 .8-.7 1.5-1.5 1.5h-4.6c-.8 0-1.5-.7-1.5-1.5v-2.5c0-.6.4-1.2 1-1.5V9.5C9.2 8.1 10.6 7 12 7zm0 1.2c-.8 0-1.5.7-1.5 1.3v1h3v-1c0-.6-.7-1.3-1.5-1.3z"/>
            </svg>
            Secure smart contracts
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Transparent fees
          </div>
        </div>
      </div>
    </section>
  )
}
