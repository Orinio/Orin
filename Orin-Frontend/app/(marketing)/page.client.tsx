'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SectionSkeleton = ({ height = 'py-24', bg = 'var(--color-paper)' }: { height?: string; bg?: string }) => (
  <div className={`${height} px-6`} style={{ backgroundColor: bg }} aria-hidden="true" />
);

const Hero = dynamic(() => import('@/components/home/Hero'), {
  loading: () => <SectionSkeleton height="min-h-[600px]" />,
});
const Problem = dynamic(() => import('@/components/home/Problem'), {
  loading: () => <SectionSkeleton bg="var(--color-surface)" />,
});
const Features = dynamic(() => import('@/components/home/Features'), {
  loading: () => <SectionSkeleton />,
});
const HowItWorks = dynamic(() => import('@/components/home/HowItWorks'), {
  loading: () => <SectionSkeleton bg="var(--color-surface)" />,
});
const Pricing = dynamic(() => import('@/components/home/Pricing'), {
  loading: () => <SectionSkeleton bg="var(--color-surface)" />,
});
const FinalCTA = dynamic(() => import('@/components/home/FinalCTA'), {
  loading: () => <SectionSkeleton height="py-28" bg="var(--color-ink)" />,
});

export default function HomeClient() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router]);

  return (
    <>
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <Pricing />
      <FinalCTA />
    </>
  );
}
