import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - ORIN Career Proof Platform',
  description: 'Free for individuals. Pro for power users. Team for organizations. Start building your verified career portfolio today.',
  keywords: ['career proof pricing', 'portfolio platform pricing', 'student career tools', 'AI career coach pricing'],
  openGraph: {
    title: 'Pricing - ORIN Career Proof Platform',
    description: 'Free for individuals. Pro for power users. Team for organizations.',
    url: 'https://orin-three.vercel.app/pricing',
    siteName: 'ORIN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - ORIN',
    description: 'Free for individuals. Pro for power users. Team for organizations.',
  },
  alternates: {
    canonical: 'https://orin-three.vercel.app/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
