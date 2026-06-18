'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { StructuredData } from '@/components/seo/StructuredData';

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setProgress((window.scrollY / scrollHeight) * 100);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="scroll-progress"
      style={{ width: `${progress}%` }}
    />
  );
}

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <StructuredData />
      <ScrollProgress />
      <Header />
      <main id="main-content" className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
