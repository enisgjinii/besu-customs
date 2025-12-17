/**
 * Test script to verify comprehensive logging
 * Run this to test that all logging features work correctly
 *
 * Usage: node -r esbuild-register scripts/test-logging.ts
 * Or just import and use the logger in your app
 */

import { errorLogger } from "../lib/error-logger";

async function testLogging() {
  console.log("🧪 Testing comprehensive logging system...\n");

  // Test 1: Info logging
  console.log("1️⃣ Testing INFO level...");
  await errorLogger.info("Test info message", {
    testData: "This is a test",
    timestamp: Date.now(),
  });

  // Test 2: Warning logging
  console.log("2️⃣ Testing WARN level...");
  await errorLogger.warn("Test warning message", {
    warningType: "test",
    severity: "low",
  });

  // Test 3: Error logging
  console.log("3️⃣ Testing ERROR level...");
  try {
    throw new Error("Test error for logging");
  } catch (error) {
    await errorLogger.error("Test error caught", error as Error, {
      context: "test script",
      recoverable: true,
    });
  }

  // Test 4: Critical logging
  console.log("4️⃣ Testing CRITICAL level...");
  try {
    throw new Error("Test critical error");
  } catch (error) {
    await errorLogger.critical("Test critical error", error as Error, {
      impact: "high",
      requiresImmediate: true,
    });
  }

  // Test 5: Debug logging
  console.log("5️⃣ Testing DEBUG level...");
  await errorLogger.debug("Test debug message", {
    debugInfo: "detailed information",
    variables: { x: 1, y: 2 },
  });

  // Test 6: Custom logging with all options
  console.log("6️⃣ Testing CUSTOM logging with all options...");
  await errorLogger.log("Custom test message", {
    level: "error",
    category: "api",
    method: "POST",
    statusCode: 500,
    userId: "test_user_123",
    additionalData: {
      endpoint: "/api/test",
      requestBody: { test: true },
      responseTime: 1234,
    },
    isClientVisible: true,
    clientMessage: "A test error occurred. This would be shown to the user.",
  });

  console.log("\n✅ All logging tests completed!");
  console.log("\n📊 Check your Vercel dashboard to see these logs with:");
  console.log("   - IP address");
  console.log("   - Geolocation (country, region, city)");
  console.log("   - Browser and OS info");
  console.log("   - Full error stacks");
  console.log("   - All custom data");
  console.log("\n🔍 Search in Vercel logs using:");
  console.log('   - level:"error"');
  console.log('   - category:"api"');
  console.log('   - userId:"test_user_123"');
  console.log("   - isClientVisible:true");
}

// Run tests
testLogging().catch(console.error);
