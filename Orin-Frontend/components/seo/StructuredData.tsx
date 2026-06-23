'use client';

const BASE_URL = 'https://orin-three.vercel.app';

export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ORIN',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
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
      availableLanguage: 'English',
    },
    foundingDate: '2024',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: 10,
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ORIN',
    url: BASE_URL,
    description: 'Turn your work into verified career proof. AI coach, proof cards, and real opportunities.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ORIN - Career Proof Platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Transform your scattered work into verified career proof with AI coaching and verifiable proof cards.',
    url: BASE_URL,
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
      bestRating: '5',
      worstRating: '1',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
