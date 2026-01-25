import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service - StacksIndex',
  description: 'Terms of Service for StacksIndex',
}

export default function TermsOfServicePage() {
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

        <h1 className="text-4xl font-heading font-bold text-white mb-8">Terms of Service</h1>

        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 mb-6">
            <strong>Last Updated:</strong> January 2025
          </p>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mb-8">
            <h2 className="text-amber-400 text-lg font-semibold mb-2">Important Disclaimer</h2>
            <p className="text-amber-200/80 text-sm">
              StacksIndex is currently in <strong>BETA</strong>. This is experimental software for cryptocurrency investing.
              By using this platform, you acknowledge and accept all associated risks. The creators, developers, and
              operators of StacksIndex bear <strong>NO RESPONSIBILITY</strong> for any financial losses, damages, or
              other negative outcomes resulting from your use of this platform.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-300 mb-4">
              By accessing or using StacksIndex, you agree to be bound by these Terms of Service. If you do not
              agree to these terms, do not use the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">2. Beta Software</h2>
            <p className="text-slate-300 mb-4">
              StacksIndex is provided as beta software. This means:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>The platform may contain bugs, errors, or unexpected behavior</li>
              <li>Features may change or be removed without notice</li>
              <li>The platform may experience downtime or interruptions</li>
              <li>Smart contracts have not been formally audited</li>
              <li>You use the platform entirely at your own risk</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">3. No Financial Advice</h2>
            <p className="text-slate-300 mb-4">
              StacksIndex does not provide financial, investment, legal, or tax advice. All content and features
              are for informational purposes only. You should consult with qualified professionals before making
              any investment decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">4. User Responsibilities</h2>
            <p className="text-slate-300 mb-4">
              As a user of StacksIndex, you are responsible for:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Securing your own wallet and private keys</li>
              <li>Understanding the risks of cryptocurrency investing</li>
              <li>Complying with all applicable laws and regulations in your jurisdiction</li>
              <li>Conducting your own research before investing</li>
              <li>Only investing funds you can afford to lose</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">5. Limitation of Liability</h2>
            <p className="text-slate-300 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE CREATORS, DEVELOPERS, OPERATORS, AND AFFILIATES OF
              STACKSINDEX SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Loss of funds or cryptocurrency</li>
              <li>Loss of profits or anticipated savings</li>
              <li>Loss of data or business interruption</li>
              <li>Smart contract failures or exploits</li>
              <li>Market volatility or price fluctuations</li>
              <li>Third-party service failures (AMMs, blockchain networks, etc.)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">6. No Warranty</h2>
            <p className="text-slate-300 mb-4">
              STACKSINDEX IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, WHETHER
              EXPRESS, IMPLIED, OR STATUTORY. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">7. Indemnification</h2>
            <p className="text-slate-300 mb-4">
              You agree to indemnify and hold harmless the creators, developers, and operators of StacksIndex
              from any claims, damages, losses, or expenses arising from your use of the platform or violation
              of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">8. Changes to Terms</h2>
            <p className="text-slate-300 mb-4">
              We reserve the right to modify these terms at any time. Continued use of the platform after
              changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">9. Contact</h2>
            <p className="text-slate-300">
              For questions about these terms, please reach out through our official channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
