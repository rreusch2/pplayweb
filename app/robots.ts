import type { MetadataRoute } from 'next'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.predictive-play.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/settings', '/dashboard'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
