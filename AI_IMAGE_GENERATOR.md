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
- **Apply generated images directly to 3D model materials** - See changes instantly!
- Download generated images
- Select which material section to apply the texture to
- Integrated into the unified sidebar under the "Export" tab
- Real-time generation with loading states
- Error handling with user-friendly notifications

## Usage

1. Navigate to the **Export** tab in the sidebar
2. Expand the **AI Image Generator** section
3. Enter a descriptive prompt (e.g., "a futuristic sports car in neon colors")
4. Click **Generate Image**
5. Once generated:
   - **Select a material section** from the dropdown to apply the texture to
   - Hover over the image to reveal action buttons:
     - Click **Apply** to instantly apply the texture to the selected material section
     - Click **Download** to save the image to your device

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
