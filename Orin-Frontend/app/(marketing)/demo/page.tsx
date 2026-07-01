import type { Metadata } from 'next';
import DemoClient from './page.client';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Demo - See Your GitHub as Career Proof | ORIN',
  description: 'Enter your GitHub username and instantly see your repos as verified Proof Cards. Get your proof score, detected skills, and actionable feedback. No signup required.',
  openGraph: {
    title: 'Demo - See Your GitHub as Career Proof | ORIN',
    description: 'Enter your GitHub username and instantly see your repos as verified Proof Cards. No signup required.',
    url: `${SITE_URL}/demo`,
  },
  keywords: [
    'github demo',
    'proof cards demo',
    'skill extraction',
    'proof score',
    'github portfolio',
    'career proof demo',
  ],
  robots: { index: true, follow: true },
};

export default function DemoPage() {
  return <DemoClient />;
}
