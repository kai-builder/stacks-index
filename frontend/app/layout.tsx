import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'
import { Web3Provider } from '@/components/providers/Web3Provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StacksIndex - Invest Stacks Ecosystem Like an Index Fund',
  description: 'Turn your USDCx into a diversified Stacks portfolio with one click. Auto-split across sBTC, stSTX, and top Stacks tokens. Powered by Circle xReserve, Bitflow, Velar, and Alex.',
  keywords: [
    'Stacks',
    'DeFi',
    'Index Fund',
    'sBTC',
    'stSTX',
    'STX',
    'Bitcoin',
    'Crypto',
    'Investment',
    'USDCx',
    'Circle',
    'Bitflow',
    'Velar',
    'Alex',
    'Portfolio',
    'Diversified',
    'One-click investing',
    'Non-custodial',
    'Stacks ecosystem',
  ],
  authors: [{ name: 'stxcity' }],
  creator: 'stxcity',
  publisher: 'stxcity',
  metadataBase: new URL('https://stacksindex.com'),
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'StacksIndex - Invest Stacks Ecosystem Like an Index Fund',
    description: 'Turn your USDCx into a diversified Stacks portfolio with one click. Auto-split across sBTC, stSTX, and top Stacks tokens.',
    type: 'website',
    url: 'https://stacksindex.com',
    siteName: 'StacksIndex',
    images: [
      'https://stacksindex.com/og-image.jpg',
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StacksIndex - Invest Stacks Ecosystem Like an Index Fund',
    description: 'Turn your USDCx into a diversified Stacks portfolio with one click.',
    images: ['https://stacksindex.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0F1C' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-body antialiased">
        <ThemeProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
