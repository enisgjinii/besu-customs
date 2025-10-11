import { NextRequest, NextResponse } from 'next/server';
import { Runware } from '@runware/sdk-js';

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 512, height = 512, numberResults = 1 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RUNWARE_AI;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Runware API key not configured' },
        { status: 500 }
      );
    }

    const runware = new Runware({ apiKey });
    await runware.connect();

    const images = await runware.requestImages({
      positivePrompt: prompt,
      width,
      height,
      numberResults,
      model: 'runware:100@1',
    });

    await runware.disconnect();

    return NextResponse.json({ 
      success: true, 
      images: images.map(img => ({
        imageURL: img.imageURL,
        imageUUID: img.imageUUID,
      }))
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
