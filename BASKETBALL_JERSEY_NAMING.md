# Basketball Jersey Top And Long Shorts Material Naming

## Overview

This document describes the special material naming logic implemented for the "Basketball Jersey Top And Long Shorts" 3D model in our application. The implementation provides more descriptive and user-friendly names for the materials based on which part of the garment they represent.

## Implementation Details

### Detection Logic

The system detects when the loaded model is the "Basketball Jersey Top And Long Shorts" using multiple criteria:

1. Filename-based detection (looking for "basketball", "jersey", "long", and "shorts" in the material names)
2. Material characteristic detection (looking for specific materials like "Metal", "Zipper", "Elastic", etc.)
3. Pattern matching for multiple "Metal" materials (at least 2) combined with "Zipper" and "Elastic"

### Material Naming Rules

Once the model is detected, the following naming transformations are applied:

| Original Material Name | New User-Friendly Name                    | Notes |
|------------------------|-------------------------------------------|-------|
| First "FABRIC"         | Back of Shorts                            | The material on the back of the shorts |
| Second "FABRIC"        | Front of Shorts                           | The material on the front of the shorts |
| "Zipper"               | Front of Shorts                           | The material on the front of the shorts |
| "Elastic"              | Waistband Elastic - Needs Further Identification | The elastic component, requires further investigation |
| "Topstitch"            | Stitching                                 | Stitching details on the garment |
| "Panel"                | Main Panel                                | The main panel of the garment |
| Button/Buttonhole      | *Removed*                                 | Button and buttonhole materials are filtered out as they don't apply to basketball jerseys |

### Code Implementation

The implementation is located in [lib/model-utils.ts](lib/model-utils.ts) in the `applyBasketballJerseyNaming` function. This function is called as part of the material extraction pipeline in the `extractSections` function, ensuring that the special naming rules are applied whenever materials are processed.

The order of processing is:
1. First apply basketball jersey naming (more specific)
2. Then apply baseball jersey reordering (more general)

### Categorization

The new material names are properly categorized:
- "Back of Shorts", "Front of Shorts", "Waistband Elastic" → "Jersey" category
- Other materials maintain their appropriate categories
- Button and buttonhole materials are filtered out entirely

## Future Improvements

The "Elastic" material is flagged as "Waistband Elastic - Needs Further Identification" because its exact purpose in the model is unclear. Future work could involve:

1. Consulting with the 3D model creators to understand what this material controls
2. Updating the naming logic once the purpose is confirmed
3. Adding visual indicators in the UI to help users understand what each material controls

## Testing

The implementation has been tested with mock material data that matches the expected materials from the "Basketball Jersey Top And Long Shorts" model. All transformations work as expected.