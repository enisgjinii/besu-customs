import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { VercelToolbar } from "@vercel/toolbar/next";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingTour } from "@/components/onboarding-tour";
import { OnboardingKeyboardHandler } from "@/components/onboarding-keyboard-handler";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorLoggerInit } from "@/app/error-logger-init";
import { ServiceWorkerInit } from "@/components/service-worker-init";
import { ConnectionIndicator } from "@/components/connection-indicator";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Besu Customs",
  description: "3D Product Configurator",
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
  maximumScale: 1,
  userScalable: false, // Prevent zooming which can cause performance issues with WebGL
  viewportFit: "cover", // For notched devices
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
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
              <Toaster />
              <OnboardingTour />
              <OnboardingKeyboardHandler />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
        <Analytics />
        {shouldInjectToolbar && <VercelToolbar />}
        <ErrorLoggerInit />
        <ServiceWorkerInit />
        <ConnectionIndicator />
      </body>
    </html>
  );
}
