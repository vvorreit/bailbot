import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { GoogleAnalytics } from "@next/third-parties/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieBanner } from "@/components/CookieBanner";
import { HelpCenter } from "@/components/HelpCenter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BailBot — Automatisation dossiers locataires",
  description: "Traitez un dossier locataire en 5 minutes. OCR local, RGPD, zéro saisie manuelle.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BailBot",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Auto-reload on ChunkLoadError (Turbopack cache corruption) */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('error', function(e) {
            if (e.message && (e.message.includes('Failed to load chunk') || e.message.includes('ChunkLoadError'))) {
              var key = 'bailbot_chunk_reload';
              var last = sessionStorage.getItem(key);
              var now = Date.now();
              if (!last || now - parseInt(last) > 10000) {
                sessionStorage.setItem(key, String(now));
                window.location.reload();
              }
            }
          });
        ` }} />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BailBot" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-xl focus:text-sm focus:font-semibold">
          Aller au contenu
        </a>
        <Providers>
          <ErrorBoundary>
            <main id="main-content">
              {children}
            </main>
          </ErrorBoundary>
          <ToastContainer />
          <HelpCenter />
          <CookieBanner />
        </Providers>
        <ServiceWorkerRegister />
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
