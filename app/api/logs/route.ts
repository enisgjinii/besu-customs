import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const log = await request.json();

    // Get IP from Vercel headers
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Add IP to log
    log.clientInfo = log.clientInfo || {};
    log.clientInfo.ip = ip;

    // Enhanced structured logging for Vercel
    const vercelLog = {
      // Vercel metadata
      vercel: true,
      environment: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      deployment: process.env.VERCEL_URL,

      // Log data
      logId: log.id,
      level: log.level,
      category: log.category,
      message: log.message,

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

      // Client details
      browser: log.clientInfo.browser,
      os: log.clientInfo.os,
      device: log.clientInfo.device,
      userAgent: log.clientInfo.userAgent,
      screenResolution: log.clientInfo.screenResolution,
      language: log.clientInfo.language,
      referrer: log.clientInfo.referrer,

      // Request details
      url: log.url,
      method: log.method,
      statusCode: log.statusCode,

      // User tracking
      userId: log.userId || "anonymous",
      sessionId: log.sessionId,

      // Error details
      stack: log.stack,
      componentStack: log.componentStack,

      // Additional data
      additionalData: log.additionalData,

      // Client visibility
      isClientVisible: log.isClientVisible,
      clientMessage: log.clientMessage,

      // Timestamp
      timestamp: log.timestamp,
    };

    // Log to Vercel (appears in Vercel dashboard logs)
    switch (log.level) {
      case "critical":
      case "error":
        console.error(JSON.stringify(vercelLog));
        break;
      case "warn":
        console.warn(JSON.stringify(vercelLog));
        break;
      default:
        console.log(JSON.stringify(vercelLog));
    }

    return NextResponse.json({
      success: true,
      ip,
      logged: true,
      vercelEnv: process.env.VERCEL_ENV,
    });
  } catch (error) {
    const errorLog = {
      vercel: true,
      type: "log_api_error",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV,
    };

    console.error(JSON.stringify(errorLog));

    return NextResponse.json(
      { error: "Failed to process log" },
      { status: 500 },
    );
  }
}
