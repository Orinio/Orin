import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - ORIN Career Proof Platform',
  description: 'Free for individuals. Pro for power users. Team for organizations. Start building your verified career portfolio today.',
  openGraph: {
    title: 'Pricing - ORIN Career Proof Platform',
    description: 'Free for individuals. Pro for power users. Team for organizations.',
    url: 'https://orin-three.vercel.app/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
