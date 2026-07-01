import Header from '@/components/header';
import Footer from '@/components/footer';
import { StructuredData } from '@/components/seo/StructuredData';
import { ScrollProgress } from '@/components/seo/ScrollProgress';

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
