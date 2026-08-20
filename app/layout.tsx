import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { VercelToolbar } from "@vercel/toolbar/next";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorLoggerInit } from "@/app/error-logger-init";
import { ServiceWorkerInit } from "@/components/service-worker-init";
import { ConnectionIndicator } from "@/components/connection-indicator";
import { LegacyGlobalUi } from "@/components/legacy-global-ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Besu Customs",
  description: "AI-powered 2D custom sportswear designer for production-ready team uniforms.",
  generator: "Enis Gjini",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Besu Customs",
  },
  formatDetection: {
    telephone: false, // Prevent auto-linking phone numbers
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // For notched devices
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shouldInjectToolbar = process.env.NODE_ENV === "development";
  const shouldInjectAnalytics =
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans overflow-hidden"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <AuthProvider>
              <QueryProvider>{children}</QueryProvider>
              <LegacyGlobalUi />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
        {shouldInjectAnalytics && <Analytics />}
        {shouldInjectToolbar && <VercelToolbar />}
        <ErrorLoggerInit />
        <ServiceWorkerInit />
        <ConnectionIndicator />
      </body>
    </html>
  );
}
