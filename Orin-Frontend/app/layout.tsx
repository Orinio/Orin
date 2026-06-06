import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/header"; 
import Footer from "@/components/footer";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "ORIN - Turn Work Into Career Proof",
  description: "Transform your scattered work into verified career proof. AI coach, proof cards, and real opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full scroll-smooth`}>
      {/* 2. Added the missing <body> tag here */}
      <body className="flex flex-col min-h-screen antialiased"> 
        <AuthProvider>
          {/* 3. Header placed at the top of the application */}
          <Header />
          
          {/* 4. 'flex-grow' ensures the main content stretches, pushing the footer down */}
          <main className="flex-grow">
            {children}
          </main>
          
          {/* 5. Footer placed at the bottom of the application */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}