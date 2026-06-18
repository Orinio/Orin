'use client';

export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ORIN',
    url: 'https://orin-three.vercel.app',
    logo: 'https://orin-three.vercel.app/logo.png',
    description: 'Turn your work into verified career proof. AI coach, proof cards, and real opportunities.',
    sameAs: [
      'https://twitter.com/orin_app',
      'https://linkedin.com/company/orin',
      'https://github.com/orin-app',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@orin.app',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ORIN',
    url: 'https://orin-three.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://orin-three.vercel.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ORIN - Career Proof Platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Transform your scattered work into verified career proof with AI coaching and verifiable proof cards.',
    url: 'https://orin-three.vercel.app',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '29',
      priceCurrency: 'USD',
      offerCount: 3,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
    </>
  );
}
