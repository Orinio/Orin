import type { Metadata } from 'next';
import ContactClient from './page.client';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact Us - ORIN Career Proof Platform',
  description: 'Have a question, feedback, or need support? Contact the Orin team. We typically respond within 24 hours on business days.',
  openGraph: {
    title: 'Contact Us - ORIN',
    description: 'Have a question, feedback, or need support? Contact the Orin team.',
    url: `${SITE_URL}/contact`,
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return <ContactClient />;
}
