export default function Head() {
  const legalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LegalWebPage',
    name: 'Terms of Service',
    url: 'https://www.predictive-play.com/terms',
    datePublished: '2025-01-01',
    dateModified: '2025-01-01',
    publisher: {
      '@type': 'Organization',
      name: 'Predictive Play',
      url: 'https://www.predictive-play.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.predictive-play.com/icon.png'
      }
    }
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How can I terminate my account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can terminate your account at any time through the app settings. For assistance, contact support@predictive-play.com.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is your refund window?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Refunds are subject to our refund policy. Please refer to the Subscription and Payments section or contact support for details.'
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(legalJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  )
}
