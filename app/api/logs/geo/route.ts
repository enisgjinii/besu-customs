import { NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';

export async function GET(request: NextRequest) {
  try {
    // Get IP from Vercel headers (most reliable on Vercel)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               request.ip ||
               'unknown';

    // Use Vercel's geolocation (available on Pro/Enterprise)
    let location = {};
    
    try {
      // Try Vercel's built-in geolocation first
      const geo = geolocation(request);
      if (geo) {
        location = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          latitude: geo.latitude,
          longitude: geo.longitude,
        };
      }
    } catch (vercelGeoError) {
      // Fallback to ipapi.co for free tier
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          location = {
            country: geoData.country_name,
            region: geoData.region,
            city: geoData.city,
            timezone: geoData.timezone,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
          };
        }
      } catch (geoError) {
        console.warn('Failed to fetch geolocation:', geoError);
      }
    }

    // Get additional headers for context
    const headers = {
      userAgent: request.headers.get('user-agent'),
      acceptLanguage: request.headers.get('accept-language'),
      referer: request.headers.get('referer'),
    };

    // Log to Vercel
    console.log(JSON.stringify({
      type: 'geo_lookup',
      ip,
      location,
      headers,
      timestamp: new Date().toISOString(),
      vercel: true,
      environment: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
    }));

    return NextResponse.json({
      ip,
      location,
      headers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(JSON.stringify({
      type: 'geo_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      vercel: true,
    }));
    
    return NextResponse.json(
      { error: 'Failed to get geolocation' },
      { status: 500 }
    );
  }
}
