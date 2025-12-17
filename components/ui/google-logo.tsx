"use client";

interface GoogleLogoProps {
  size?: number;
  className?: string;
  variant?: "default" | "circle" | "monogram";
}

export function GoogleLogo({
  size = 20,
  className = "",
  variant = "default",
}: GoogleLogoProps) {
  // Monogram variant: official Google 'G' mark with colored segments inside white circle
  if (variant === "monogram") {
    const circleSize = size + 14; // extra padding for visual balance
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-white dark:bg-white border border-border shadow-sm ${className}`}
        style={{ width: circleSize, height: circleSize }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 18 18"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="#4285F4"
            d="M17.64 9.2045c0-.638-.0573-1.2527-.1636-1.8414H9v3.4818h4.8445c-.2082 1.124-.84 2.0772-1.7909 2.7163v2.2581h2.8973c1.6973-1.5628 2.6881-3.8645 2.6881-6.6154z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.4673-.8065 5.9564-2.1809l-2.8973-2.2581c-.8064.54-1.8372.8618-3.0591.8618-2.3527 0-4.3455-1.5882-5.0555-3.7227H.9564v2.3372C2.4382 15.8727 5.4818 18 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.9445 10.7018c-.18-.54-.2836-1.1164-.2836-1.7018s.1036-1.1618.2836-1.7018V4.9609H.9564C.3477 6.1827 0 7.5564 0 9c0 1.4436.3477 2.8173.9564 4.0391l2.9881-2.3373z"
          />
          <path
            fill="#EA4335"
            d="M9 3.579c1.3218 0 2.5137.4554 3.4473 1.3518l2.5836-2.5836C13.4637.8064 11.4264 0 9 0 5.4818 0 2.4382 2.1273.9564 5.9609l2.9881 2.3373C4.6545 5.1673 6.6473 3.579 9 3.579z"
          />
        </svg>
      </div>
    );
  }
  if (variant === "circle") {
    const circleSize = size + 8; // padding inside circle
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-white dark:bg-background border border-border shadow-sm ${className}`}
        style={{ width: circleSize, height: circleSize }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="#EA4335"
            d="M12 11.99v4.8h6.69c-.27 1.57-1.87 4.6-6.69 4.6-4.03 0-7.31-3.33-7.31-7.42S7.97 6.55 12 6.55c2.29 0 3.83.97 4.71 1.8l3.3-3.24C18.64 3.55 15.82 2.2 12 2.2 5.73 2.2.6 7.35.6 13.62c0 6.27 5.13 11.42 11.4 11.42 6.58 0 10.93-4.62 10.93-11.13 0-.75-.08-1.32-.18-1.92H12Z"
          />
          <path
            fill="#34A853"
            d="M3.15 7.15A11.37 11.37 0 0 1 12 2.2c3.82 0 6.64 1.35 8.01 2.91l-3.32 3.24c-.88-.83-2.42-1.8-4.7-1.8-4.03 0-7.31 3.33-7.31 7.42 0 1.83.69 3.49 1.82 4.74L3.15 7.15Z"
          />
          <path
            fill="#FBBC05"
            d="M12 25.04c4.82 0 6.42-3.03 6.69-4.6H12v-4.8h11.15c.1.6.18 1.17.18 1.92 0 6.51-4.35 11.13-10.93 11.13-6.27 0-11.4-5.15-11.4-11.42 0-1.97.49-3.83 1.36-5.47l3.35 9.58c-1.13-1.25-1.82-2.9-1.82-4.73 0 4.09 3.28 7.42 7.31 7.42Z"
          />
          <path
            fill="#4285F4"
            d="M23.15 11.19H12v4.8h6.69c-.32 1.87-2.11 4.6-6.69 4.6-4.03 0-7.31-3.33-7.31-7.42S7.97 6.55 12 6.55c2.29 0 3.83.97 4.71 1.8l3.3-3.24C18.64 3.55 15.82 2.2 12 2.2 5.73 2.2.6 7.35.6 13.62c0 6.27 5.13 11.42 11.4 11.42 6.58 0 10.93-4.62 10.93-11.13 0-.75-.08-1.32-.18-1.92Z"
          />
        </svg>
      </div>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M12 11.99v4.8h6.69c-.27 1.57-1.87 4.6-6.69 4.6-4.03 0-7.31-3.33-7.31-7.42S7.97 6.55 12 6.55c2.29 0 3.83.97 4.71 1.8l3.3-3.24C18.64 3.55 15.82 2.2 12 2.2 5.73 2.2.6 7.35.6 13.62c0 6.27 5.13 11.42 11.4 11.42 6.58 0 10.93-4.62 10.93-11.13 0-.75-.08-1.32-.18-1.92H12Z"
      />
      <path
        fill="#34A853"
        d="M3.15 7.15A11.37 11.37 0 0 1 12 2.2c3.82 0 6.64 1.35 8.01 2.91l-3.32 3.24c-.88-.83-2.42-1.8-4.7-1.8-4.03 0-7.31 3.33-7.31 7.42 0 1.83.69 3.49 1.82 4.74L3.15 7.15Z"
      />
      <path
        fill="#FBBC05"
        d="M12 25.04c4.82 0 6.42-3.03 6.69-4.6H12v-4.8h11.15c.1.6.18 1.17.18 1.92 0 6.51-4.35 11.13-10.93 11.13-6.27 0-11.4-5.15-11.4-11.42 0-1.97.49-3.83 1.36-5.47l3.35 9.58c-1.13-1.25-1.82-2.9-1.82-4.73 0 4.09 3.28 7.42 7.31 7.42Z"
      />
      <path
        fill="#4285F4"
        d="M23.15 11.19H12v4.8h6.69c-.32 1.87-2.11 4.6-6.69 4.6-4.03 0-7.31-3.33-7.31-7.42S7.97 6.55 12 6.55c2.29 0 3.83.97 4.71 1.8l3.3-3.24C18.64 3.55 15.82 2.2 12 2.2 5.73 2.2.6 7.35.6 13.62c0 6.27 5.13 11.42 11.4 11.42 6.58 0 10.93-4.62 10.93-11.13 0-.75-.08-1.32-.18-1.92Z"
      />
    </svg>
  );
}
