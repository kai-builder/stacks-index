'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github, Twitter } from 'lucide-react'
import { STACKS_INDEX_CONTRACT } from '@/lib/stacks/contract'
import { useWalletStore } from '@/lib/store/wallet'

export function Footer() {
  const { network } = useWalletStore()
  const isMainnet = network === 'mainnet'

  return (
    <footer className="relative border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="StacksIndex" width={32} height={32} />
              <span className="font-heading font-bold text-lg text-white">
                StacksIndex
              </span>
            </Link>
            <p className="text-sm text-slate-400 mb-4 max-w-xs">
              The simplest way to get diversified exposure to the Stacks ecosystem.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://x.com/stxcity"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/app" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/app/invest" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Invest
                </Link>
              </li>
              <li>
                <Link href="/app/withdraw" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Withdraw
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link href="https://docs.stacks.co" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/risk-disclosure" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Risk Disclosure
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Powered by section */}
        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center">
          <p className="text-xs text-slate-500">
            powered by{' '}
            <a href="https://www.circle.com/xreserve" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
              Circle xReserve
            </a>
            {' x '}
            <a href="https://www.stacks.co" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#5546FF] transition-colors">
              Stacks
            </a>
            {' x '}
            <a href="https://bitflow.finance" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#2563EB] transition-colors">
              Bitflow
            </a>
            {' x '}
            <a href="https://velar.co" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#00D1FF] transition-colors">
              Velar
            </a>
            {' x '}
            <a href="https://alexlab.co" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#FF6B00] transition-colors">
              Alex
            </a>
            {' and '}
            <a
              href={`https://explorer.hiro.so/txid/${STACKS_INDEX_CONTRACT.fullName}?chain=${isMainnet ? 'mainnet' : 'testnet'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-amber-400 transition-colors"
            >
              {STACKS_INDEX_CONTRACT.name}
            </a>
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Built on Stacks. Powered by Bitcoin. A product by{' '}
            <a
              href="https://stx.city"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              stx.city
            </a>
          </p>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} StacksIndex. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
