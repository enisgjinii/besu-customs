# 3D Model Materials Extraction Script

This script extracts material information from 3D models in the project and saves detailed reports to text files.

## Overview

The materials extraction script processes all GLB files in the `public/models` directory and generates:

1. Individual material reports for each model
2. A consolidated summary report

## Current Implementation

The current implementation provides a framework with mock data generation. This approach was chosen because:

1. Three.js is primarily a browser library and requires additional setup to run in Node.js
2. GLB file parsing in Node.js requires specific polyfills for browser APIs
3. The script provides a solid foundation that can be extended with actual parsing logic

## Running the Script

To run the materials extraction script:

```bash
cd /Users/enisgjini/Desktop/besu-customs
node scripts/extract-materials.js
```

Or using the npm script:

```bash
cd /Users/enisgjini/Desktop/besu-customs
npm run extract-materials
```

## Output

The script generates output files in the `materials-output` directory:

- Individual material reports for each model (e.g., `Baseball caps-materials.txt`)
- A consolidated summary report (`materials-summary.txt`)

## Extending for Actual Material Extraction

To implement actual material extraction, you would need to:

1. Use a Node.js compatible GLB parser, or
2. Run the script in a browser environment with Three.js, or
3. Add polyfills for browser APIs required by Three.js

The framework includes commented pseudocode showing how the actual implementation would work.

## Material Information Extracted

For each material, the script extracts:

- ID
- Name
- Type
- Color
- Roughness
- Metalness
- Texture information (base color map, normal map, etc.)
- Emissive properties
- Transparency information

## File Structure

```
besu-customs/
├── scripts/
│   └── extract-materials.js    # Main extraction script
├── public/
│   └── models/                 # Directory with GLB models
└── materials-output/           # Generated reports (created by script)
    ├── [model-name]-materials.txt
    └── materials-summary.txt
```
