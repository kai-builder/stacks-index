'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { WalletButton } from '@/components/wallet/WalletButton'

export function Navbar() {
  const pathname = usePathname()
  const isAppRoute = pathname?.startsWith('/app')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Beta Banner */}
      {isAppRoute && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-black">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Beta - Max: $50 USDCx</span>
          </div>
        </div>
      )}

      <nav
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          isAppRoute ? 'top-7 sm:top-9' : 'top-0'
        } ${
          scrolled
            ? 'bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" legacyBehavior>
              <a className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
                <div className="relative">
                  <Image
                    src="/logo.svg"
                    alt="StacksIndex"
                    width={36}
                    height={36}
                    className="w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-heading font-bold text-lg sm:text-xl text-white">
                    StacksIndex
                  </span>
                  <span className="px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                    Beta
                  </span>
                </div>
              </a>
            </Link>

          {/* Navigation links (app routes) */}
          <div className="flex items-center gap-2 sm:gap-6">
            {isAppRoute && (
              <div className="hidden sm:flex items-center gap-1">
                <NavLink href="/app/invest" active={pathname === '/app/invest'}>
                  Invest
                </NavLink>
                <NavLink href="/app" active={pathname === '/app'}>
                  Portfolio
                </NavLink>
                <NavLink href="/app/profit" active={pathname === '/app/profit'}>
                  Sell
                </NavLink>
                <NavLink href="/app/withdraw" active={pathname === '/app/withdraw'}>
                  Withdraw
                </NavLink>
                <NavLink href="/app/history" active={pathname === '/app/history'}>
                  History
                </NavLink>
              </div>
            )}

            {/* Landing page links */}
            {!isAppRoute && (
              <div className="hidden sm:flex items-center gap-1">
                <NavLink href="/app" active={false}>
                  Dashboard
                </NavLink>
                <NavLink href="#how-it-works" active={false}>
                  How It Works
                </NavLink>
                <NavLink href="#" active={false}>
                  Docs
                </NavLink>
              </div>
            )}

            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
    </>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link href={href} prefetch={true} legacyBehavior>
      <a
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? 'text-white bg-white/10'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {children}
      </a>
    </Link>
  )
}
