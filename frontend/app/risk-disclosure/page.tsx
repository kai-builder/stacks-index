import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Risk Disclosure - StacksIndex',
  description: 'Risk Disclosure for StacksIndex',
}

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-heading font-bold text-white mb-8">Risk Disclosure</h1>

        <div className="prose prose-invert prose-slate max-w-none">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-red-400 text-xl font-semibold mb-2">IMPORTANT WARNING</h2>
                <p className="text-red-200/80">
                  StacksIndex is <strong>BETA SOFTWARE</strong> for <strong>CRYPTOCURRENCY INVESTING</strong>.
                  Cryptocurrency investments are highly speculative and carry significant risk of loss.
                  You could lose ALL of your invested funds. The creators, developers, and operators of
                  StacksIndex accept <strong>NO RESPONSIBILITY</strong> for any losses you may incur.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mb-8">
            <h2 className="text-amber-400 text-lg font-semibold mb-2">By Using StacksIndex, You Acknowledge:</h2>
            <ul className="text-amber-200/80 space-y-2 text-sm">
              <li>You understand and accept ALL risks described on this page</li>
              <li>You are investing at your own risk with funds you can afford to lose</li>
              <li>The creators bear no responsibility for any financial losses</li>
              <li>This is beta software and may contain bugs or vulnerabilities</li>
              <li>Past performance does not guarantee future results</li>
            </ul>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">1. Cryptocurrency Risks</h2>
            <p className="text-slate-300 mb-4">
              Investing in cryptocurrency involves substantial risk:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Extreme Volatility:</strong> Cryptocurrency prices can change dramatically in minutes</li>
              <li><strong>Total Loss:</strong> You may lose 100% of your investment</li>
              <li><strong>No Guarantees:</strong> There is no guarantee of returns or principal protection</li>
              <li><strong>Regulatory Risk:</strong> Laws and regulations may change, affecting your investments</li>
              <li><strong>Market Manipulation:</strong> Crypto markets may be subject to manipulation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">2. Smart Contract Risks</h2>
            <p className="text-slate-300 mb-4">
              StacksIndex uses smart contracts that carry inherent risks:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Unaudited Code:</strong> Smart contracts have NOT been formally audited</li>
              <li><strong>Bugs and Vulnerabilities:</strong> Code may contain errors that could result in loss of funds</li>
              <li><strong>Exploits:</strong> Malicious actors may discover and exploit vulnerabilities</li>
              <li><strong>Immutability:</strong> Once deployed, smart contract behavior cannot always be changed</li>
              <li><strong>Irreversible Transactions:</strong> Blockchain transactions cannot be reversed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">3. Beta Software Risks</h2>
            <p className="text-slate-300 mb-4">
              As beta software, StacksIndex has additional risks:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Unstable Features:</strong> Features may not work as expected</li>
              <li><strong>Data Loss:</strong> Data may be lost or corrupted</li>
              <li><strong>Downtime:</strong> The platform may be unavailable without notice</li>
              <li><strong>Breaking Changes:</strong> Updates may affect your positions or funds</li>
              <li><strong>Limited Support:</strong> Support resources may be limited</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">4. Third-Party Risks</h2>
            <p className="text-slate-300 mb-4">
              StacksIndex depends on third-party services:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>AMM Protocols:</strong> Velar, Alex, and other DEXs may fail or be exploited</li>
              <li><strong>Blockchain Network:</strong> Stacks network may experience issues or attacks</li>
              <li><strong>API Providers:</strong> Data providers may be inaccurate or unavailable</li>
              <li><strong>Wallet Providers:</strong> Wallet software may have vulnerabilities</li>
              <li><strong>Underlying Assets:</strong> sBTC, stSTX, and other tokens carry their own risks</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">5. Liquidity Risks</h2>
            <p className="text-slate-300 mb-4">
              You may face difficulties when trying to exit positions:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Slippage:</strong> Large trades may significantly impact prices</li>
              <li><strong>Low Liquidity:</strong> Some tokens may have limited liquidity</li>
              <li><strong>Failed Transactions:</strong> Swap transactions may fail due to market conditions</li>
              <li><strong>Withdrawal Delays:</strong> Market conditions may affect withdrawal execution</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">6. No Responsibility Disclaimer</h2>
            <div className="bg-slate-800/50 rounded-lg p-6">
              <p className="text-slate-300 mb-4">
                THE CREATORS, DEVELOPERS, OPERATORS, CONTRIBUTORS, AND AFFILIATES OF STACKSINDEX:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Are NOT responsible for any financial losses you incur</li>
                <li>Are NOT liable for smart contract bugs, exploits, or failures</li>
                <li>Are NOT liable for third-party service failures</li>
                <li>Make NO guarantees about platform availability or performance</li>
                <li>Make NO promises about investment returns</li>
                <li>Provide NO financial, investment, or legal advice</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">7. Your Acknowledgment</h2>
            <p className="text-slate-300 mb-4">
              By using StacksIndex, you confirm that you:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Have read and understood all risks disclosed on this page</li>
              <li>Accept full responsibility for your investment decisions</li>
              <li>Are investing only funds you can afford to lose completely</li>
              <li>Will not hold StacksIndex creators responsible for any losses</li>
              <li>Understand this is beta software with no guarantees</li>
              <li>Have conducted your own research and due diligence</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">8. Recommendation</h2>
            <p className="text-slate-300">
              We strongly recommend that you:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-4">
              <li>Start with small amounts to understand the platform</li>
              <li>Never invest more than you can afford to lose</li>
              <li>Consult with a qualified financial advisor</li>
              <li>Stay informed about cryptocurrency regulations in your jurisdiction</li>
              <li>Regularly review your positions and risk exposure</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
