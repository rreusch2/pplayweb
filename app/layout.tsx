import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import LayoutWrapper from '@/components/LayoutWrapper'
import AnalyticsProvider from '@/components/AnalyticsProvider'
import ScrollDepthTracker from '@/components/ScrollDepthTracker'
import ScrollToTop from '@/components/ScrollToTop'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'AI Sports Betting Predictions - 73% Win Rate | Predictive Play',
    template: '%s | Predictive Play'
  },
  description: 'Join 50,000+ successful bettors using AI-powered MLB, NBA, WNBA & UFC predictions. 73% win rate, Professor Lock chat, real-time analytics. Start winning today!',
  keywords: [
    'AI sports betting predictions',
    'daily betting predictions', 
    'Professor Lock AI chat',
    'MLB predictions',
    'NBA predictions',
    'WNBA predictions',
    'UFC predictions',
    'sports betting analytics',
    '73% win rate',
    'parlay builder',
    'betting trends',
    'live odds tracking'
  ].join(', '),
  authors: [{ name: 'Predictive Play', url: 'https://www.predictive-play.com' }],
  creator: 'Predictive Play',
  publisher: 'Predictive Play',
  category: 'Sports Betting & Analytics',
  classification: 'Sports Technology',
  metadataBase: new URL('https://www.predictive-play.com'),
  alternates: {
    canonical: 'https://www.predictive-play.com',
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/icon.png',
    apple: [{ url: '/icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'AI Sports Betting Predictions - 73% Win Rate | Predictive Play',
    description: 'Join 50,000+ successful bettors using AI-powered predictions. MLB, NBA, WNBA & UFC picks with Professor Lock chat support.',
    url: 'https://www.predictive-play.com',
    siteName: 'Predictive Play',
    images: [
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'Predictive Play - AI Sports Betting Predictions with 73% Win Rate',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
    countryName: 'United States',
    ttl: 604800,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@PredictivePlay',
    creator: '@PredictivePlay',
    title: 'AI Sports Betting Predictions - 73% Win Rate',
    description: 'Join 50,000+ bettors using AI predictions. MLB, NBA, WNBA & UFC picks with Professor Lock chat.',
    images: {
      url: '/og-banner.png',
      alt: 'Predictive Play AI Sports Betting Predictions',
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION || undefined,
  },
  other: {
    'msapplication-TileColor': '#2563eb',
    'theme-color': '#2563eb',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
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
    '@id': 'https://www.predictive-play.com/#organization',
    name: 'Predictive Play',
    alternateName: 'PredictivePlay',
    url: 'https://www.predictive-play.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.predictive-play.com/icon.png',
      width: '512',
      height: '512'
    },
    image: 'https://www.predictive-play.com/og-banner.png',
    description: 'AI-powered sports betting predictions with 73% win rate. MLB, NBA, WNBA & UFC predictions with Professor Lock AI chat support.',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-PREDICT',
      contactType: 'Customer Service',
      availableLanguage: 'English'
    },
    sameAs: [
      'https://twitter.com/PredictivePlay',
      'https://facebook.com/PredictivePlay',
      'https://instagram.com/PredictivePlay'
    ]
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.predictive-play.com/#website',
    url: 'https://www.predictive-play.com',
    name: 'Predictive Play',
    description: 'AI Sports Betting Predictions Platform',
    publisher: {
      '@id': 'https://www.predictive-play.com/#organization'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.predictive-play.com/predictions?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US'
  }

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://www.predictive-play.com/#service',
    name: 'AI Sports Betting Predictions',
    description: 'Advanced AI-powered sports betting predictions with 73% win rate covering MLB, NBA, WNBA, and UFC.',
    provider: {
      '@id': 'https://www.predictive-play.com/#organization'
    },
    serviceType: 'Sports Analytics & Predictions',
    areaServed: 'US',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Subscription Plans',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Pro Plan'
          },
          price: '24.99',
          priceCurrency: 'USD'
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Elite Plan'
          },
          price: '29.99',
          priceCurrency: 'USD'
        }
      ]
    }
  }

  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Predictive Play - AI Sports Betting',
    operatingSystem: 'iOS, Android, Web',
    applicationCategory: 'Sports',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '2847',
      bestRating: '5',
      worstRating: '1'
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  }

  return (
    <html lang="en" className="h-full">
      <head>
        {/* Enhanced SEO Meta Tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Predictive Play" />
        <meta name="application-name" content="Predictive Play" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://js.stripe.com" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Enhanced JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
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
          <SimpleAuthProvider>
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
          </SimpleAuthProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
