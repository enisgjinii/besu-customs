# Mesh / Material Renaming Reference

This document explains how raw mesh/material names are turned into user-facing part names in this repo.

Generated from:

- `lib/material-name-parser.ts`
- `lib/three-material-utils.ts`
- `components/three-scene.tsx`

Machine-readable map:

- `mesh-part-renaming-map.json`

---

## 1) Main renaming pipelines

There are **two active naming pipelines** in code:

1. **`parseMaterialName()` in `lib/material-name-parser.ts`**
   - Rule-based parser with categories + default colors + priority.
   - Used for intelligent parsing/grouping workflows.

2. **`parseMaterialName()` inside `lib/three-material-utils.ts`**
   - Runtime display-name normalization when sections are extracted from Three.js materials.
   - Includes **model-specific overrides** (basketball, volleyball), strict direct mappings, and cleanup rules.

---

## 2) How runtime section names are built (the one users mostly see)

In `extractSectionsFromThreeModel()` (`lib/three-material-utils.ts`):

1. Traverse meshes and materials in the model.
2. For each unique `material.name`, compute a display name via parser.
3. Build section object:
   - `id = material.name`
   - `originalName = material.name`
   - `name = parsed displayName`
4. Skip sections when display name is `HIDDEN`.

So the **raw material name is the identity key**, and the parser output is the human-readable label.

---

## 3) Model-specific overrides

### Basketball models

When model URL contains either:

- `basketball-jersey-top-and-long-shorts`
- `basketball-jersey-and-shorts`

Examples of forced renames:

- names containing `2842` -> `Pants Waist Trim`
- names containing `2845` -> `Back of Shorts`
- names containing `2848` -> `Front of Shorts`
- `body_f`/`front` -> `Front of Jersey`
- `body_b`/`back` -> `Back of Jersey`
- names containing `66694` -> `Shorts Side Panels`
- names containing `ble` -> `Jersey Sleeve & Collar Trim`
- `fabric_1`/`fabric 1` -> `Shorts`
- names containing `waist` -> `Waistband`
- names containing `button` -> `HIDDEN` (removed from UI sections)

### Volleyball models

When model URL contains `volleyball`:

- names containing `body` -> `Body`
- names containing `sleeve` -> `Sleeves`

### Soccer crew neck model

When model URL contains `soccer-jersey-crew-neck` (including `soccer-jersey-crew-neck_FIXED.glb`):

- `lambert2` -> `Front and Back`
- `lambert4` -> `Inside Collar`
- `lambert3` -> `Collar`

---

## 4) Global direct overrides map

In `lib/three-material-utils.ts`, strict exact key mapping:

- `fabric_front` -> `Front Body`
- `fabric_back` -> `Back Body`
- `fabric_sleeve_l` -> `Left Sleeve`
- `fabric_sleeve_r` -> `Right Sleeve`
- `collar_1` -> `Collar`
- `trim_neck` -> `Neck Trim`
- `fabric 1` -> `Main Body`
- `fabric_1` -> `Main Body`
- `fabic 1` -> `Main Body`
- `material` -> `Base`
- `default_button` -> `Button`

---

## 5) Generic cleanup normalization

If no model-specific or strict override applies, runtime parser cleans names by:

- removing technical words (`generated`, `instance`, `clone`, `copy`)
- removing prefixes (`mat_`, `material_`, `mtl_`, `mesh_`, `obj_`)
- removing trailing numeric suffix (`.001`, `_001`, `-001`)
- replacing separators (`.`, `_`, `-`) with spaces
- splitting camelCase and alpha+digit boundaries
- removing shader/material words (`lambert`, `phong`, `standard`, `pbr`, `blinn`)
- title-casing words
- replacing standalone single-letter tokens:
  - `L` -> `Left`
  - `R` -> `Right`
  - `F` -> `Front`
  - `B` -> `Back`

Fallback if empty: `Part`.

---

## 6) How renamed sections are matched back to materials

In `applyMaterialsToThreeModel()` (`lib/three-material-utils.ts`), section-to-material matching checks:

1. `section.originalName === material.name`
2. `section.id === material.name`
3. `material.name.includes(section.originalName)`
4. fallback using mesh name (`child.name`) exact/includes checks

This means **stable material names are critical** for reliable color application.

---

## 7) API sections + extracted sections merge behavior

In `components/three-scene.tsx`, if API sections are loaded, app preserves API names but merges extracted colors by matching:

- `extracted.id === apiSection.id`
- `extracted.originalName === apiSection.originalName`
- `extracted.id === apiSection.originalName`

So user-friendly API naming can coexist with real model-derived color values.

---

## 8) JSON reference

For tooling/scripts, use:

- `mesh-part-renaming-map.json`

It contains:

- ordered parsing rules
- model overrides
- strict name map
- normalization steps
- section matching rules
- examples
