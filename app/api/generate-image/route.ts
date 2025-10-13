import { NextRequest, NextResponse } from 'next/server';
import { RunwareClient } from '@runware/sdk-js';

// Simple in-memory store for API usage tracking
// Note: For production, use a proper database or Redis
const apiUsageStore = new Map<string, { count: number; lastReset: number }>();

// Reset time in milliseconds (24 hours)
const RESET_TIME = 24 * 60 * 60 * 1000;

// Maximum API calls allowed
const MAX_API_CALLS = 3;

function getApiKey(request: NextRequest): string {
  // Use IP address as the key for anonymous users
  // For authenticated users, you could use user ID from headers/session
  return request.headers.get('x-forwarded-for') || 'unknown';
}

function checkAndIncrementUsage(key: string): { allowed: boolean; count: number } {
  const now = Date.now();
  const usage = apiUsageStore.get(key);
  
  // Reset count if it's been more than 24 hours
  if (!usage || now - usage.lastReset > RESET_TIME) {
    apiUsageStore.set(key, { count: 1, lastReset: now });
    return { allowed: true, count: 1 };
  }
  
  // Check if user has exceeded the limit
  if (usage.count >= MAX_API_CALLS) {
    return { allowed: false, count: usage.count };
  }
  
  // Increment the count
  apiUsageStore.set(key, { count: usage.count + 1, lastReset: usage.lastReset });
  return { allowed: true, count: usage.count + 1 };
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const apiKey = getApiKey(request);
    const usage = checkAndIncrementUsage(apiKey);
    
    if (!usage.allowed) {
      return NextResponse.json(
        { 
          error: `API usage limit exceeded. Maximum ${MAX_API_CALLS} calls per day.`,
          limit: MAX_API_CALLS,
          used: usage.count
        },
        { status: 429 }
      );
    }

    const { prompt, width = 512, height = 512, numberResults = 1 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const runwareApiKey = process.env.RUNWARE_AI;
    if (!runwareApiKey) {
      return NextResponse.json(
        { error: 'Runware API key not configured' },
        { status: 500 }
      );
    }

    const runware = new RunwareClient({ apiKey: runwareApiKey });

    const images = await runware.requestImages({
      positivePrompt: prompt,
      width,
      height,
      numberResults,
      model: 'runware:100@1',
    });

    return NextResponse.json({ 
      success: true, 
      images: images?.map((img) => ({
        imageURL: img.imageURL || '',
        imageUUID: img.imageUUID,
      })) || [],
      usage: {
        limit: MAX_API_CALLS,
        used: usage.count,
        remaining: MAX_API_CALLS - usage.count
      }
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}