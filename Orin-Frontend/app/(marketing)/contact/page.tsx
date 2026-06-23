import type { Metadata } from 'next';
import ContactClient from './page.client';

export const metadata: Metadata = {
  title: 'Contact Us - ORIN Career Proof Platform',
  description: 'Have a question, feedback, or need support? Contact the Orin team. We typically respond within 24 hours on business days.',
  openGraph: {
    title: 'Contact Us - ORIN',
    description: 'Have a question, feedback, or need support? Contact the Orin team.',
    url: 'https://orin-three.vercel.app/contact',
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return <ContactClient />;
}
