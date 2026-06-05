'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const Navbar = dynamic(() => import('@/components/home/Navbar'), {
  loading: () => <div className="h-16" />
});
const Hero = dynamic(() => import('@/components/home/Hero'), {
  loading: () => <div className="min-h-[600px] flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }} />
});
const Problem = dynamic(() => import('@/components/home/Problem'), {
  loading: () => <div className="py-24 px-6" style={{ backgroundColor: 'var(--color-surface)' }} />
});
const Features = dynamic(() => import('@/components/home/Features'), {
  loading: () => <div className="py-24 px-6" style={{ backgroundColor: 'var(--color-paper)' }} />
});
const HowItWorks = dynamic(() => import('@/components/home/HowItWorks'), {
  loading: () => <div className="py-24 px-6" style={{ backgroundColor: 'var(--color-surface)' }} />
});
const Stats = dynamic(() => import('@/components/home/Stats'), {
  loading: () => <div className="py-20 px-6" style={{ backgroundColor: 'var(--color-paper)' }} />
});
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), {
  loading: () => <div className="py-24 px-6" style={{ backgroundColor: 'var(--color-surface)' }} />
});
const Pricing = dynamic(() => import('@/components/home/Pricing'), {
  loading: () => <div className="py-24 px-6" style={{ backgroundColor: 'var(--color-paper)' }} />
});
const FinalCTA = dynamic(() => import('@/components/home/FinalCTA'), {
  loading: () => <div className="py-24 px-6" style={{ backgroundColor: 'var(--color-paper)' }} />
});
const Footer = dynamic(() => import('@/components/home/Footer'), {
  loading: () => <div className="py-16 px-6" style={{ backgroundColor: 'var(--color-ink)' }} />
});

export default function Home() {
  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        window.location.href = '/dashboard';
      }
    };
    checkUser();
  }, []);

  return (
    <main id="main-content">
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
