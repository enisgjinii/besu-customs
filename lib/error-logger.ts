export type LogLevel = "info" | "warn" | "error" | "debug" | "critical";
export type LogCategory =
  | "api"
  | "auth"
  | "database"
  | "ui"
  | "network"
  | "performance"
  | "security"
  | "system";

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export interface ClientInfo {
  ip?: string;
  userAgent: string;
  browser?: string;
  os?: string;
  device?: string;
  screenResolution?: string;
  language?: string;
  referrer?: string;
}

export interface ErrorLog {
  id: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  method?: string;
  statusCode?: number;
  componentStack?: string;
  clientInfo: ClientInfo;
  geoLocation?: GeoLocation;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
  isClientVisible: boolean;
  clientMessage?: string;
}

// Vercel-optimized console logging with structured data
function vercelLog(level: LogLevel, data: any) {
  if (typeof window !== "undefined") {
    return;
  }

  const logData = {
    ...data,
    vercel: true,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    region: process.env.VERCEL_REGION,
    deployment: process.env.VERCEL_URL,
  };

  // Vercel automatically captures and indexes console logs
  switch (level) {
    case "critical":
    case "error":
      console.error(JSON.stringify(logData));
      break;
    case "warn":
      console.warn(JSON.stringify(logData));
      break;
    case "debug":
      console.debug(JSON.stringify(logData));
      break;
    default:
      console.log(JSON.stringify(logData));
  }
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 200;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseUserAgent(userAgent: string) {
    const browser =
      userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] ||
      "Unknown";
    const os =
      userAgent.match(/(Windows|Mac|Linux|Android|iOS)[\s\w.]*/)?.[0] ||
      "Unknown";
    const device = /Mobile|Tablet|iPad|iPhone|Android/.test(userAgent)
      ? "Mobile"
      : "Desktop";

    return { browser, os, device };
  }

  private getClientInfo(): ClientInfo {
    if (typeof window === "undefined") {
      return {
        userAgent: "server",
        browser: "server",
        os: "server",
        device: "server",
      };
    }

    const userAgent = window.navigator.userAgent;
    const { browser, os, device } = this.parseUserAgent(userAgent);

    return {
      userAgent,
      browser,
      os,
      device,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: window.navigator.language,
      referrer: document.referrer || "direct",
    };
  }

  async log(
    message: string,
    options: {
      level?: LogLevel;
      category?: LogCategory;
      error?: Error;
      componentStack?: string;
      statusCode?: number;
      method?: string;
      additionalData?: Record<string, any>;
      userId?: string;
      isClientVisible?: boolean;
      clientMessage?: string;
    } = {},
  ) {
    const {
      level = "info",
      category = "system",
      error,
      componentStack,
      statusCode,
      method,
      additionalData,
      userId,
      isClientVisible = false,
      clientMessage,
    } = options;

    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      category,
      message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "server",
      method,
      statusCode,
      componentStack,
      clientInfo: this.getClientInfo(),
      userId,
      sessionId: this.sessionId,
      additionalData,
      isClientVisible,
      clientMessage: clientMessage || (isClientVisible ? message : undefined),
    };

    // Fetch IP and geolocation
    try {
      const geoData = await this.fetchGeoLocation();
      errorLog.geoLocation = geoData.location;
      errorLog.clientInfo.ip = geoData.ip;
    } catch (err) {
      console.warn("Failed to fetch geolocation:", err);
    }

    this.logs.unshift(errorLog);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging with colors
    this.logToConsole(errorLog);

    // Send to backend
    await this.sendToBackend(errorLog);

    return errorLog;
  }

  private logToConsole(log: ErrorLog) {
    // Structured logging for Vercel
    const structuredLog = {
      // Core fields
      level: log.level,
      category: log.category,
      message: log.message,
      timestamp: log.timestamp,

      // Location & IP
      ip: log.clientInfo.ip,
      country: log.geoLocation?.country,
      region: log.geoLocation?.region,
      city: log.geoLocation?.city,
      timezone: log.geoLocation?.timezone,
      coordinates:
        log.geoLocation?.latitude && log.geoLocation?.longitude
          ? `${log.geoLocation.latitude},${log.geoLocation.longitude}`
          : undefined,

      // Client info
      browser: log.clientInfo.browser,
      os: log.clientInfo.os,
      device: log.clientInfo.device,
      userAgent: log.clientInfo.userAgent,
      screenResolution: log.clientInfo.screenResolution,
      language: log.clientInfo.language,
      referrer: log.clientInfo.referrer,

      // Request info
      url: log.url,
      method: log.method,
      statusCode: log.statusCode,

      // User tracking
      userId: log.userId || "anonymous",
      sessionId: log.sessionId,

      // Error details
      stack: log.stack,
      componentStack: log.componentStack,

      // Additional context
      additionalData: log.additionalData,

      // Client visibility
      isClientVisible: log.isClientVisible,
      clientMessage: log.clientMessage,

      // Metadata
      logId: log.id,
    };

    // Send to Vercel logs (structured JSON for better indexing)
    vercelLog(log.level, structuredLog);

    // Intentionally silent on local/browser console.
  }

  private async fetchGeoLocation(): Promise<{
    ip?: string;
    location?: GeoLocation;
  }> {
    try {
      // Try to get IP and location from backend
      const response = await fetch("/api/logs/geo");
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      // Fallback: try public IP service
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipResponse.json();
        return { ip };
      } catch (fallbackErr) {
        // Silent fail
      }
    }
    return {};
  }

  private async sendToBackend(errorLog: ErrorLog) {
    // Only send to backend API in production (Vercel)
    if (process.env.VERCEL_ENV) {
      try {
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorLog),
        });
      } catch (err) {
        console.error("Failed to send log to backend:", err);
      }
    }
  }

  // Quick logging methods
  info(message: string, data?: Record<string, any>) {
    return this.log(message, { level: "info", additionalData: data });
  }

  warn(message: string, data?: Record<string, any>) {
    return this.log(message, { level: "warn", additionalData: data });
  }

  error(message: string, error?: Error, data?: Record<string, any>) {
    return this.log(message, { level: "error", error, additionalData: data });
  }

  critical(message: string, error?: Error, data?: Record<string, any>) {
    return this.log(message, {
      level: "critical",
      error,
      additionalData: data,
    });
  }

  debug(message: string, data?: Record<string, any>) {
    return this.log(message, { level: "debug", additionalData: data });
  }

  getLogs(filters?: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: string;
  }): ErrorLog[] {
    let filtered = [...this.logs];

    if (filters?.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }
    if (filters?.category) {
      filtered = filtered.filter((log) => log.category === filters.category);
    }
    if (filters?.userId) {
      filtered = filtered.filter((log) => log.userId === filters.userId);
    }

    return filtered;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const errorLogger = new ErrorLogger();
