import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { PlanProvider } from "@/lib/plan-context";
import { RoleProvider } from "@/lib/role-context";
import { FeatureFlagProvider } from "@/lib/feature-flag-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { PostHogProvider } from "@/lib/analytics";
import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";
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
  title: {
    default: DEFAULT_SEO_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SEO_DESCRIPTION,
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/logo.png',
  },
  openGraph: {
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: DEFAULT_SEO_TITLE,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: ['/twitter-image'],
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'ORIN',
    'theme-color': '#0BAB77',
    'google-site-verification': 'eoPnbWHCjN44bzAl1f3U9d2SqJGGIgBdNGKslbf_G1I',
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
              <PlanProvider>
                <RoleProvider>
                  <FeatureFlagProvider>
                    <PostHogProvider>{children}</PostHogProvider>
                  </FeatureFlagProvider>
                </RoleProvider>
              </PlanProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
