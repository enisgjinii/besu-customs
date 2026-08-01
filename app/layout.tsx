import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { VercelToolbar } from "@vercel/toolbar/next";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorLoggerInit } from "@/app/error-logger-init";
import { ServiceWorkerInit } from "@/components/service-worker-init";
import { ConnectionIndicator } from "@/components/connection-indicator";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { LegacyGlobalUi } from "@/components/legacy-global-ui";
import "./globals.css";

const macan = localFont({
  src: [
    {
      path: "../public/font/Macan Font/MacanPanWeb-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/font/Macan Font/MacanPanWeb-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/font/Macan Font/MacanPanWeb-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/font/Macan Font/MacanPanWeb-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-macan",
  display: "swap",
});

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
      <body
        suppressHydrationWarning
        className={`font-sans ${macan.variable} overflow-hidden`}
      >
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
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
        </AppRouterCacheProvider>
        {shouldInjectAnalytics && <Analytics />}
        {shouldInjectToolbar && <VercelToolbar />}
        <ErrorLoggerInit />
        <ServiceWorkerInit />
        <ConnectionIndicator />
      </body>
    </html>
  );
}
