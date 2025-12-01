"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div 
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "#0f0f0f",
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div 
            style={{
              maxWidth: "400px",
              width: "100%",
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div 
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <div 
                style={{
                  width: "64px",
                  height: "64px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle 
                  style={{ 
                    width: "32px", 
                    height: "32px", 
                    color: "#ef4444" 
                  }} 
                />
              </div>
            </div>
            
            <h1 
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              Application Error
            </h1>
            
            <p 
              style={{
                color: "#888",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              The application encountered a critical error. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === "development" && (
              <div 
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  backgroundColor: "#111",
                  borderRadius: "8px",
                  textAlign: "left",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  overflow: "auto",
                  maxHeight: "100px",
                }}
              >
                <p style={{ color: "#ef4444" }}>{error.message}</p>
                {error.digest && (
                  <p style={{ color: "#666", marginTop: "4px" }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            
            <div 
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <button
                onClick={() => reset()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <RefreshCw style={{ width: "16px", height: "16px" }} />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  color: "#888",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
