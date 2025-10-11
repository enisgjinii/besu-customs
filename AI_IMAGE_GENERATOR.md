# AI Image Generator - Runware Integration

This feature integrates Runware AI for generating images directly within the 3D configurator.

## Setup

1. **API Key**: The Runware API key is already configured in `.env`:
   ```
   RUNWARE_AI=abcDG49ByKT5gDU1tY68vlD7jTY9H9lQ
   ```

2. **Dependencies**: The `@runware/sdk-js` package has been installed.

## Features

- Generate AI images using text prompts
- Download generated images
- Integrated into the unified sidebar under the "Export" tab
- Real-time generation with loading states
- Error handling with user-friendly notifications

## Usage

1. Navigate to the **Export** tab in the sidebar
2. Expand the **AI Image Generator** section
3. Enter a descriptive prompt (e.g., "a futuristic sports car in neon colors")
4. Click **Generate Image**
5. Once generated, hover over the image and click **Download** to save it

## API Endpoint

- **Route**: `/api/generate-image`
- **Method**: POST
- **Body**:
  ```json
  {
    "prompt": "your image description",
    "width": 512,
    "height": 512,
    "numberResults": 1
  }
  ```

## Components

- `components/ai-image-generator.tsx` - Main UI component
- `app/api/generate-image/route.ts` - API route handler
- `components/unified-sidebar.tsx` - Integration point

## Customization

You can modify the default parameters in `components/ai-image-generator.tsx`:
- Image dimensions (width/height)
- Number of results
- Model selection (currently using `runware:100@1`)

## Documentation

For more details on Runware AI capabilities, visit:
https://runware.ai/docs/en/getting-started/how-to-connect
