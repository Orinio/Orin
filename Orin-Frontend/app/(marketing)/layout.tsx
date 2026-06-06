import Header from '@/components/header';
import Footer from '@/components/footer';

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
}
