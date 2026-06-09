import Navigation from "@/components/Navigation";

export default function EmployerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main
        id="main-content"
        className="lg:ml-[260px] min-h-screen px-4 py-8 md:px-6 lg:px-8 transition-all duration-300"
      >
        <div className="mx-auto max-w-[1200px]">
          {children}
        </div>
      </main>
    </div>
  );
}
