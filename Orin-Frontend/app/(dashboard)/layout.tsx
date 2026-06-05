import Navigation from "@/components/Navigation";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <Navigation />
      <main id="main-content" className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
