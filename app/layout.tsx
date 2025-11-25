import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingTour } from "@/components/onboarding-tour";
import { OnboardingKeyboardHandler } from "@/components/onboarding-keyboard-handler";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Besu Customs",
  description: "3D Product Configurator",
  generator: "Enis Gjini",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zooming which can cause performance issues with WebGL
    viewportFit: "cover", // For notched devices
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Besu Customs",
  },
  formatDetection: {
    telephone: false, // Prevent auto-linking phone numbers
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>{children}</QueryProvider>
            <Toaster />
            <OnboardingTour />
            <OnboardingKeyboardHandler />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
