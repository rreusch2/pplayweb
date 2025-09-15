import type { Metadata } from 'next'
import Link from 'next/link'
import { Brain } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service – Predictive Play',
  description:
    'Review the Predictive Play Terms of Service: user eligibility, subscription policy, disclaimers, IP rights and more (Effective Jan 1, 2025).',
  alternates: {
    canonical: 'https://www.predictive-play.com/terms',
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-2 rounded"
      >
        Skip to main content
      </a>

      {/* Header */}
      <nav role="navigation" className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                Predictive Play
              </span>
            </Link>
            
            <Link 
              href="/"
              className="text-white hover:text-blue-300 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Quick Table of Contents */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-2">On this page</h2>
          <ul className="list-disc pl-6 text-gray-200 space-y-1">
            <li><a href="#acceptance-of-terms" className="hover:underline">1. Acceptance of Terms</a></li>
            <li><a href="#description-of-service" className="hover:underline">2. Description of Service</a></li>
            <li><a href="#user-eligibility" className="hover:underline">3. User Eligibility</a></li>
            <li><a href="#account-responsibilities" className="hover:underline">4. Account Responsibilities</a></li>
            <li><a href="#subscription-and-payments" className="hover:underline">5. Subscription and Payments</a></li>
            <li><a href="#disclaimers-and-risk" className="hover:underline">6. Disclaimers and Risk Warning</a></li>
            <li><a href="#prohibited-uses" className="hover:underline">7. Prohibited Uses</a></li>
            <li><a href="#intellectual-property" className="hover:underline">8. Intellectual Property</a></li>
            <li><a href="#limitation-of-liability" className="hover:underline">9. Limitation of Liability</a></li>
            <li><a href="#termination" className="hover:underline">10. Termination</a></li>
            <li><a href="#changes-to-terms" className="hover:underline">11. Changes to Terms</a></li>
            <li><a href="#contact" className="hover:underline">12. Contact Information</a></li>
          </ul>
        </div>
      </div>

      {/* Content */}
      <main id="main-content" role="main" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="prose prose-invert prose-blue max-w-none">
            <div className="text-gray-200 space-y-6">
              <p><strong>Effective Date:</strong> January 1, 2025</p>
              <p><strong>Last updated:</strong> January 1, 2025</p>
              
              <p>
                Welcome to Predictive Play! These Terms of Service ("Terms") govern your use of 
                our AI-powered sports betting prediction platform. By using our service, you 
                agree to these Terms.
              </p>

              <h2 id="acceptance-of-terms" className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Predictive Play, you agree to be bound by these Terms 
                and our Privacy Policy. If you disagree with any part of these Terms, you 
                may not use our service.
              </p>

              <h2 id="description-of-service" className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
              <p>
                Predictive Play provides AI-powered sports betting predictions, analytics, 
                and insights. Our service is for informational and entertainment purposes only.
              </p>

              <h2 id="user-eligibility" className="text-2xl font-semibold text-white mt-8 mb-4">3. User Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old</li>
                <li>You must comply with all applicable laws and regulations</li>
                <li>Sports betting may be restricted or prohibited in your jurisdiction</li>
                <li>You are responsible for ensuring compliance with local laws</li>
              </ul>

              <h2 id="account-responsibilities" className="text-2xl font-semibold text-white mt-8 mb-4">4. Account Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>You are responsible for all activities under your account</li>
              </ul>

              <h2 id="subscription-and-payments" className="text-2xl font-semibold text-white mt-8 mb-4">5. Subscription and Payments</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscription fees are billed in advance</li>
                <li>All payments are processed securely through Stripe</li>
                <li>Refunds are subject to our refund policy</li>
                <li>We may change pricing with reasonable notice</li>
              </ul>

              <h2 id="disclaimers-and-risk" className="text-2xl font-semibold text-white mt-8 mb-4">6. Disclaimers and Risk Warning</h2>
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/30">
                <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Important Risk Warning</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Sports betting involves significant financial risk</strong></li>
                  <li>Our predictions are not guarantees of outcomes</li>
                  <li>Past performance does not predict future results</li>
                  <li>Never bet more than you can afford to lose</li>
                  <li>Seek help if you have gambling problems</li>
                </ul>
              </div>

              <h2 id="prohibited-uses" className="text-2xl font-semibold text-white mt-8 mb-4">7. Prohibited Uses</h2>
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the service for illegal activities</li>
                <li>Share account credentials with others</li>
                <li>Attempt to reverse engineer our algorithms</li>
                <li>Distribute or resell our predictions</li>
                <li>Harass other users or our staff</li>
              </ul>

              <h2 id="intellectual-property" className="text-2xl font-semibold text-white mt-8 mb-4">8. Intellectual Property</h2>
              <p>
                All content, algorithms, and technology used in Predictive Play are our 
                proprietary intellectual property. You may not copy, modify, or distribute 
                our content without permission.
              </p>

              <h2 id="limitation-of-liability" className="text-2xl font-semibold text-white mt-8 mb-4">9. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PREDICTIVE PLAY SHALL NOT BE LIABLE 
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING 
                LOST PROFITS OR BETTING LOSSES.
              </p>

              <h2 id="termination" className="text-2xl font-semibold text-white mt-8 mb-4">10. Termination</h2>
              <p>
                We may terminate or suspend your account at any time for violations of these 
                Terms. You may terminate your account at any time through the app settings.
              </p>

              <h2 id="changes-to-terms" className="text-2xl font-semibold text-white mt-8 mb-4">11. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. Significant changes will be communicated 
                through the app or by email. Continued use constitutes acceptance of new Terms.
              </p>

              <h2 id="contact" className="text-2xl font-semibold text-white mt-8 mb-4">12. Contact Information</h2>
              <p>
                For questions about these Terms, contact us at:
              </p>
              <div className="bg-blue-900/30 p-4 rounded-lg mt-4">
                <p><strong>Email:</strong> predictiveplay2025@gmail.com</p>
                <p><strong>Address:</strong> Predictive Play Legal Team</p>
              </div>

              <div className="bg-yellow-900/30 p-4 rounded-lg mt-8 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">🎲 Responsible Gaming</h3>
                <p>
                  If you or someone you know has a gambling problem, help is available:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>National Council on Problem Gambling: 1-800-522-4700</li>
                  <li>GamCare (UK): 0808 8020 133</li>
                  <li>Gambling Therapy: www.gamblingtherapy.org</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}