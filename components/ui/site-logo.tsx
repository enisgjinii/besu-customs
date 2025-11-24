"use client";
import Image from "next/image";

interface SiteLogoProps {
  size?: number;
  className?: string;
  src?: string; // allow override
  withBackground?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export function SiteLogo({
  size = 48,
  className = "",
  src,
  withBackground = true,
  rounded = "lg",
}: SiteLogoProps) {
  const logoSrc = src || "/LOGO-gg.png"; // default asset; can be swapped
  const radiusMap: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  const containerRadius = radiusMap[rounded];

  if (!withBackground) {
    return (
      <Image
        src={logoSrc}
        alt="Besu Customs Logo"
        width={size}
        height={size}
        priority
        className={`select-none object-contain ${className}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center bg-muted/60 dark:bg-muted/40 border border-border ${containerRadius} p-2 shadow-sm backdrop-blur-sm ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      <Image
        src={logoSrc}
        alt="Besu Customs Logo"
        width={size}
        height={size}
        priority
        className={`select-none object-contain ${containerRadius}`}
      />
    </div>
  );
}
