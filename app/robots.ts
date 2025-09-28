import type { MetadataRoute } from 'next'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.predictive-play.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/professor-lock', '/pricing'],
        disallow: [
          '/admin/*',
          '/api/*',
          '/settings/*',
          '/dashboard/*',
          '/games/*',
          '/predictions/*',
          '/trends/*',
          '/test-*',
          '/_next/*',
          '/delete-account/*',
          '/force-onboarding/*'
        ],
      },
      // Allow search engine bots to access public content
      {
        userAgent: ['Googlebot', 'Bingbot', 'Slurp'],
        allow: ['/', '/professor-lock', '/pricing', '/privacy', '/terms'],
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
