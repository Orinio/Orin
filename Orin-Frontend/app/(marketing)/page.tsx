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
const Stats = dynamic(() => import('@/components/home/Stats'), {
  loading: () => <SectionSkeleton height="py-20" bg="var(--color-ink)" />,
});
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), {
  loading: () => <SectionSkeleton bg="var(--color-surface)" />,
});
const Pricing = dynamic(() => import('@/components/home/Pricing'), {
  loading: () => <SectionSkeleton />,
});

export default function Home() {
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
      <Stats />
      <Testimonials />
      <Pricing />
    </>
  );
}
