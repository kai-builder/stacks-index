import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - StacksIndex',
  description: 'Privacy Policy for StacksIndex',
}

export default function PrivacyPolicyPage() {
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

        <h1 className="text-4xl font-heading font-bold text-white mb-8">Privacy Policy</h1>

        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 mb-6">
            <strong>Last Updated:</strong> January 2025
          </p>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mb-8">
            <h2 className="text-amber-400 text-lg font-semibold mb-2">Beta Disclaimer</h2>
            <p className="text-amber-200/80 text-sm">
              StacksIndex is currently in <strong>BETA</strong>. This privacy policy may be updated as the
              platform evolves. By using this platform, you acknowledge that you understand and accept the
              risks associated with beta software.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-slate-300 mb-4">
              StacksIndex is designed with privacy in mind. We collect minimal information:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Wallet Addresses:</strong> Your public Stacks wallet address when you connect to the platform</li>
              <li><strong>Transaction Data:</strong> On-chain transaction data that is publicly available on the Stacks blockchain</li>
              <li><strong>Usage Analytics:</strong> Basic, anonymized usage statistics to improve the platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">2. Information We Do NOT Collect</h2>
            <p className="text-slate-300 mb-4">
              We do not collect:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Personal identification information (name, email, phone number)</li>
              <li>Private keys or seed phrases</li>
              <li>Financial information beyond on-chain data</li>
              <li>Location data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">3. Blockchain Transparency</h2>
            <p className="text-slate-300 mb-4">
              Please be aware that all transactions on the Stacks blockchain are public and permanent.
              This includes:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Your wallet address</li>
              <li>Transaction amounts and timestamps</li>
              <li>Interactions with smart contracts</li>
              <li>Token balances and transfers</li>
            </ul>
            <p className="text-slate-300 mt-4">
              This data is visible to anyone and cannot be deleted or modified.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">4. Third-Party Services</h2>
            <p className="text-slate-300 mb-4">
              StacksIndex integrates with third-party services that have their own privacy policies:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Wallet Providers:</strong> (e.g., Leather, Xverse) - for wallet connections</li>
              <li><strong>Hiro API:</strong> - for blockchain data</li>
              <li><strong>AMM Protocols:</strong> (Velar, Alex) - for token swaps</li>
            </ul>
            <p className="text-slate-300 mt-4">
              We encourage you to review the privacy policies of these services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">5. Data Security</h2>
            <p className="text-slate-300 mb-4">
              We implement reasonable security measures to protect any data we handle. However, no system
              is completely secure. As a beta platform, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">6. Cookies</h2>
            <p className="text-slate-300 mb-4">
              We may use essential cookies for basic platform functionality. We do not use tracking cookies
              or sell data to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">7. Your Rights</h2>
            <p className="text-slate-300 mb-4">
              Since we collect minimal personal data, traditional data rights (access, deletion, etc.)
              have limited applicability. You can disconnect your wallet at any time to stop using the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-slate-300 mb-4">
              We may update this privacy policy as the platform evolves. Continued use of StacksIndex
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-white mb-4">9. Contact</h2>
            <p className="text-slate-300">
              For privacy-related questions, please reach out through our official channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
