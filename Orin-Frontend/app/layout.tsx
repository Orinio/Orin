import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { PlanProvider } from "@/lib/plan-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toast";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ORIN - Turn Work Into Career Proof",
  description:
    "Transform your scattered work into verified career proof. AI coach, proof cards, and real opportunities.",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/logo.png',
  },
  openGraph: {
    title: "ORIN - Turn Work Into Career Proof",
    description: "Transform your scattered work into verified career proof. AI coach, proof cards, and real opportunities.",
    images: ['/logo.png'],
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'ORIN',
    'theme-color': '#0BAB77',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0BAB77',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full scroll-smooth`}>
      <body className="flex min-h-screen flex-col antialiased bg-[var(--color-paper)] text-[var(--color-ink)] overflow-x-hidden">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <PlanProvider>{children}</PlanProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
