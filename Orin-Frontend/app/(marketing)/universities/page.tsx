import type { Metadata } from 'next';
import UniversitiesClient from './page.client';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Universities - ORIN Career Services Platform',
  description: 'Help your students build verified career proof portfolios. AI-powered career guidance, accreditation-ready data, and real-time readiness tracking for career services offices.',
  openGraph: {
    title: 'Universities - ORIN Career Services Platform',
    description: 'AI-powered career guidance, accreditation-ready data, and real-time readiness tracking for career services offices.',
    url: `${SITE_URL}/universities`,
  },
  keywords: [
    'university career services',
    'student career readiness',
    'career advising platform',
    'accreditation data',
    'student portfolio verification',
  ],
  robots: { index: true, follow: true },
};

export default function UniversitiesPage() {
  return <UniversitiesClient />;
}
