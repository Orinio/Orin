import type { Metadata } from 'next';
import EmployersWaitlistClient from './page.client';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Employer Waitlist - ORIN Verified Talent Platform',
  description: 'Access students with verified, source-linked proof of their skills. Join the Orin employer waitlist for early access to verified talent.',
  openGraph: {
    title: 'Employer Waitlist - ORIN',
    description: 'Access students with verified, source-linked proof of their skills. Join the waitlist for early access.',
    url: `${SITE_URL}/employers/waitlist`,
  },
  robots: { index: true, follow: true },
};

export default function EmployersWaitlistPage() {
  return <EmployersWaitlistClient />;
}
