import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
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
      <body className="min-h-full font-sans" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
