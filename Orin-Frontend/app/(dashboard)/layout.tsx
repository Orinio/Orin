import Navigation from "@/components/Navigation";
import Footer from "@/components/footer";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main id="main-content" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
