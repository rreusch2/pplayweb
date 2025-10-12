import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import LayoutWrapper from '@/components/LayoutWrapper'
import AnalyticsProvider from '@/components/AnalyticsProvider'
import ScrollDepthTracker from '@/components/ScrollDepthTracker'
import ScrollToTop from '@/components/ScrollToTop'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Sports Betting Predictions | NBA, NFL & Soccer Odds Forecasts – Predictive Play',
  description: 'Get daily AI-driven NBA, NFL & Premier League betting predictions. 72%+ accuracy, advanced analytics & expert tips — start winning today.',
  keywords: 'AI sports betting predictions, daily betting predictions, sports betting analytics, NBA predictions, NFL predictions, Premier League predictions, soccer odds forecasts',
  authors: [{ name: 'Predictive Play' }],
  creator: 'Predictive Play',
  publisher: 'Predictive Play',
  metadataBase: new URL('https://www.predictive-play.com'),
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'AI Sports Betting Predictions | NBA, NFL & Soccer Odds Forecasts – Predictive Play',
    description: 'Daily AI-driven betting predictions with transparent accuracy and advanced analytics.',
    url: 'https://www.predictive-play.com',
    siteName: 'Predictive Play',
    images: [
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'Daily AI Sports Betting Predictions – Predictive Play',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Sports Betting Predictions – Predictive Play',
    description: 'Daily AI-driven betting predictions with transparent accuracy and advanced analytics.',
    images: ['/og-banner.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Predictive Play',
    url: 'https://www.predictive-play.com',
    logo: 'https://www.predictive-play.com/icon.png',
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://www.predictive-play.com',
    name: 'Predictive Play',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.predictive-play.com/trends?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-2 rounded"
        >
          Skip to main content
        </a>
        <AnalyticsProvider>
          <ScrollDepthTracker />
          <ScrollToTop />
          <AuthProvider>
            <SubscriptionProvider>
              <div className="min-h-full">
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    style: {
                      background: '#10B981',
                      color: '#ffffff',
                    },
                  },
                  error: {
                    duration: 5000,
                    style: {
                      background: '#EF4444',
                      color: '#ffffff',
                    },
                  },
                }}
              />
            </SubscriptionProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
