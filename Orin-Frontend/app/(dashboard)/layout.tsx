import Navigation from "@/components/Navigation";
import Footer from "@/components/footer";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Desktop: offset by sidebar width (260px default). Mobile: normal flow with header + bottom bar */}
      <main
        id="main-content"
        className="lg:ml-[260px] min-h-screen px-4 py-8 md:px-6 lg:px-8 transition-all duration-300"
      >
        <div className="mx-auto max-w-[1100px]">
          {children}
        </div>
      </main>
      <div className="lg:ml-[260px]">
        <Footer />
      </div>
      {/* Mobile bottom bar spacer */}
      <div className="lg:hidden h-[76px]" />
    </div>
  );
}
