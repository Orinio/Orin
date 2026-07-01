import { SITE_NAME, SITE_URL } from '@/lib/seo';

export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
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
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Turn your work into verified career proof. AI coach, proof cards, and real opportunities.',
    inLanguage: 'en-US',
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ORIN - Career Proof Platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Transform your scattered work into verified career proof with AI coaching and verifiable proof cards.',
    url: SITE_URL,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '29',
      priceCurrency: 'USD',
      offerCount: 3,
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
        item: SITE_URL,
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
