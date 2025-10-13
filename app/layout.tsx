import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingWelcome } from "@/components/onboarding-welcome";
import { OnboardingTour } from "@/components/onboarding-tour";
import { OnboardingInfoButton } from "@/components/onboarding-info-button";
import { OnboardingKeyboardHandler } from "@/components/onboarding-keyboard-handler";
import "./globals.css";

export const metadata: Metadata = {
  title: "Besu Customs",
  description: "3D Product Configurator",
  generator: "Enis Gjini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Toaster />
        <OnboardingWelcome />
        <OnboardingTour />
        <OnboardingInfoButton />
        <OnboardingKeyboardHandler />
        <Analytics />
      </body>
    </html>
  );
}
