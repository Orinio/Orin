import type { Metadata } from 'next';
import HomeClient from './page.client';

export const metadata: Metadata = {
  title: 'ORIN - Turn Work Into Career Proof',
  description:
    'Transform scattered projects, repos, and certificates into verified career proof. AI coach, proof cards, and real opportunities for students and professionals.',
  keywords: [
    'career proof',
    'portfolio platform',
    'student career',
    'AI career coach',
    'proof cards',
    'verified portfolio',
    'job matching',
    'skill verification',
    'career readiness',
    'student portfolio',
  ],
  openGraph: {
    title: 'ORIN - Turn Work Into Career Proof',
    description: 'Transform scattered projects, repos, and certificates into verified career proof. AI coach, proof cards, and real opportunities.',
    url: 'https://orin-three.vercel.app',
    siteName: 'ORIN',
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'ORIN - Turn Work Into Career Proof',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ORIN - Turn Work Into Career Proof',
    description: 'Transform scattered projects, repos, and certificates into verified career proof.',
    images: ['/og-home.png'],
  },
  alternates: {
    canonical: 'https://orin-three.vercel.app',
  },
  robots: { index: true, follow: true },
};

export default function Home() {
  return <HomeClient />;
}
