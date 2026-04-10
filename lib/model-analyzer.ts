"use client";

import * as THREE from "three";

/**
 * Model Analyzer Utility
 * Analyzes 3D model structure: meshes, materials, nodes, UV maps
 */

export interface MeshInfo {
  name: string;
  type: string;
  vertexCount: number;
  faceCount: number;
  hasUV: boolean;
  hasUV2: boolean;
  hasNormals: boolean;
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
  };
  materials: MaterialInfo[];
  parent: string | null;
  children: string[];
  worldPosition: { x: number; y: number; z: number };
}

export interface MaterialInfo {
  name: string;
  type: string;
  color: string | null;
  map: string | null;
  normalMap: string | null;
  roughness: number | null;
  metalness: number | null;
  transparent: boolean;
  opacity: number;
  side: string;
}

export interface NodeInfo {
  name: string;
  type: string;
  depth: number;
  path: string;
  childCount: number;
  visible: boolean;
}

export interface UVInfo {
  meshName: string;
  uvChannel: number;
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
  coverage: number; // Percentage of UV space used
  isNormalized: boolean; // All UVs within 0-1 range
}

export interface ModelAnalysis {
  summary: {
    totalNodes: number;
    totalMeshes: number;
    totalMaterials: number;
    totalVertices: number;
    totalFaces: number;
    boundingBox: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
      size: { x: number; y: number; z: number };
      center: { x: number; y: number; z: number };
    };
  };
  hierarchy: NodeInfo[];
  meshes: MeshInfo[];
  materials: MaterialInfo[];
  uvMaps: UVInfo[];
  warnings: string[];
}

/**
 * Analyze a Three.js scene/model and return detailed structure info
 */
export function analyzeModel(scene: THREE.Object3D): ModelAnalysis {
  const hierarchy: NodeInfo[] = [];
  const meshes: MeshInfo[] = [];
  const materialsMap = new Map<string, MaterialInfo>();
  const uvMaps: UVInfo[] = [];
  const warnings: string[] = [];

  let totalVertices = 0;
  let totalFaces = 0;

  // Traverse and collect info
  const traverseNode = (node: THREE.Object3D, depth: number, path: string) => {
    const nodePath = path ? `${path}/${node.name || "unnamed"}` : node.name || "root";

    // Add to hierarchy
    hierarchy.push({
      name: node.name || `[${node.type}]`,
      type: node.type,
      depth,
      path: nodePath,
      childCount: node.children.length,
      visible: node.visible,
    });

    // Process meshes
    if (node instanceof THREE.Mesh) {
      const geometry = node.geometry;
      const materials = Array.isArray(node.material) ? node.material : [node.material];

      // Geometry info
      const positionAttr = geometry.getAttribute("position");
      const uvAttr = geometry.getAttribute("uv");
      const uv2Attr = geometry.getAttribute("uv2");
      const normalAttr = geometry.getAttribute("normal");
      const indexAttr = geometry.getIndex();

      const vertexCount = positionAttr?.count || 0;
      const faceCount = indexAttr ? indexAttr.count / 3 : vertexCount / 3;

      totalVertices += vertexCount;
      totalFaces += faceCount;

      // Bounding box
      geometry.computeBoundingBox();
      const box = geometry.boundingBox || new THREE.Box3();
      const size = new THREE.Vector3();
      box.getSize(size);

      // World position
      const worldPos = new THREE.Vector3();
      node.getWorldPosition(worldPos);

      // Material info
      const meshMaterials: MaterialInfo[] = materials.map((mat) => {
        const matInfo = extractMaterialInfo(mat);
        materialsMap.set(mat.name || mat.uuid, matInfo);
        return matInfo;
      });

      meshes.push({
        name: node.name || `mesh_${meshes.length}`,
        type: node.type,
        vertexCount,
        faceCount,
        hasUV: !!uvAttr,
        hasUV2: !!uv2Attr,
        hasNormals: !!normalAttr,
        boundingBox: {
          min: { x: box.min.x, y: box.min.y, z: box.min.z },
          max: { x: box.max.x, y: box.max.y, z: box.max.z },
          size: { x: size.x, y: size.y, z: size.z },
        },
        materials: meshMaterials,
        parent: node.parent?.name || null,
        children: node.children.map((c) => c.name || c.type),
        worldPosition: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
      });

      // UV analysis
      if (uvAttr) {
        const uvInfo = analyzeUVs(node.name || `mesh_${meshes.length - 1}`, uvAttr, 0);
        uvMaps.push(uvInfo);

        if (!uvInfo.isNormalized) {
          warnings.push(`Mesh "${node.name}" has UVs outside 0-1 range`);
        }
      } else {
        warnings.push(`Mesh "${node.name}" has no UV coordinates`);
      }

      if (uv2Attr) {
        const uv2Info = analyzeUVs(node.name || `mesh_${meshes.length - 1}`, uv2Attr, 1);
        uvMaps.push(uv2Info);
      }
    }

    // Recurse children
    node.children.forEach((child) => {
      traverseNode(child, depth + 1, nodePath);
    });
  };

  traverseNode(scene, 0, "");

  // Compute overall bounding box
  const overallBox = new THREE.Box3().setFromObject(scene);
  const overallSize = new THREE.Vector3();
  const overallCenter = new THREE.Vector3();
  overallBox.getSize(overallSize);
  overallBox.getCenter(overallCenter);

  return {
    summary: {
      totalNodes: hierarchy.length,
      totalMeshes: meshes.length,
      totalMaterials: materialsMap.size,
      totalVertices,
      totalFaces,
      boundingBox: {
        min: { x: overallBox.min.x, y: overallBox.min.y, z: overallBox.min.z },
        max: { x: overallBox.max.x, y: overallBox.max.y, z: overallBox.max.z },
        size: { x: overallSize.x, y: overallSize.y, z: overallSize.z },
        center: { x: overallCenter.x, y: overallCenter.y, z: overallCenter.z },
      },
    },
    hierarchy,
    meshes,
    materials: Array.from(materialsMap.values()),
    uvMaps,
    warnings,
  };
}

/**
 * Extract material information
 */
function extractMaterialInfo(material: THREE.Material): MaterialInfo {
  const info: MaterialInfo = {
    name: material.name || "unnamed",
    type: material.type,
    color: null,
    map: null,
    normalMap: null,
    roughness: null,
    metalness: null,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side === THREE.FrontSide ? "front" : material.side === THREE.BackSide ? "back" : "double",
  };

  if (material instanceof THREE.MeshStandardMaterial) {
    info.color = "#" + material.color.getHexString();
    info.map = material.map?.name || (material.map ? "texture" : null);
    info.normalMap = material.normalMap?.name || (material.normalMap ? "normalMap" : null);
    info.roughness = material.roughness;
    info.metalness = material.metalness;
  } else if (material instanceof THREE.MeshBasicMaterial) {
    info.color = "#" + material.color.getHexString();
    info.map = material.map?.name || (material.map ? "texture" : null);
  } else if (material instanceof THREE.MeshPhongMaterial) {
    info.color = "#" + material.color.getHexString();
    info.map = material.map?.name || (material.map ? "texture" : null);
  }

  return info;
}

/**
 * Analyze UV coordinates
 */
function analyzeUVs(meshName: string, uvAttr: THREE.BufferAttribute, channel: number): UVInfo {
  let minU = Infinity, maxU = -Infinity;
  let minV = Infinity, maxV = -Infinity;

  for (let i = 0; i < uvAttr.count; i++) {
    const u = uvAttr.getX(i);
    const v = uvAttr.getY(i);
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }

  const rangeU = maxU - minU;
  const rangeV = maxV - minV;
  const coverage = rangeU * rangeV * 100; // Approximate coverage percentage

  return {
    meshName,
    uvChannel: channel,
    minU,
    maxU,
    minV,
    maxV,
    coverage: Math.min(coverage, 100),
    isNormalized: minU >= 0 && maxU <= 1 && minV >= 0 && maxV <= 1,
  };
}

/**
 * Print model analysis to console in a readable format
 */
export function printModelAnalysis(analysis: ModelAnalysis): void {
  console.group(" MODEL ANALYSIS");

  // Summary
  console.group(" Summary");
  console.log(`Total Nodes: ${analysis.summary.totalNodes}`);
  console.log(`Total Meshes: ${analysis.summary.totalMeshes}`);
  console.log(`Total Materials: ${analysis.summary.totalMaterials}`);
  console.log(`Total Vertices: ${analysis.summary.totalVertices.toLocaleString()}`);
  console.log(`Total Faces: ${analysis.summary.totalFaces.toLocaleString()}`);
  console.log(`Bounding Box Size: ${analysis.summary.boundingBox.size.x.toFixed(2)} x ${analysis.summary.boundingBox.size.y.toFixed(2)} x ${analysis.summary.boundingBox.size.z.toFixed(2)}`);
  console.groupEnd();

  // Hierarchy
  console.group(" Node Hierarchy");
  analysis.hierarchy.forEach((node) => {
    const indent = "  ".repeat(node.depth);
    const icon = node.type === "Mesh" ? "" : node.type === "Group" ? "" : "";
    console.log(`${indent}${icon} ${node.name} (${node.type})${node.childCount > 0 ? ` [${node.childCount} children]` : ""}`);
  });
  console.groupEnd();

  // Meshes
  console.group(" Meshes");
  analysis.meshes.forEach((mesh) => {
    console.group(`${mesh.name}`);
    console.log(`Vertices: ${mesh.vertexCount.toLocaleString()}, Faces: ${mesh.faceCount.toLocaleString()}`);
    console.log(`UV: ${mesh.hasUV ? "" : ""}, UV2: ${mesh.hasUV2 ? "" : ""}, Normals: ${mesh.hasNormals ? "" : ""}`);
    console.log(`Materials: ${mesh.materials.map((m) => m.name).join(", ")}`);
    console.groupEnd();
  });
  console.groupEnd();

  // Materials
  console.group(" Materials");
  analysis.materials.forEach((mat) => {
    console.log(`${mat.name}: ${mat.type}, Color: ${mat.color}, Roughness: ${mat.roughness}, Metalness: ${mat.metalness}`);
  });
  console.groupEnd();

  // UV Maps
  console.group(" UV Maps");
  analysis.uvMaps.forEach((uv) => {
    console.log(`${uv.meshName} (UV${uv.uvChannel}): Range [${uv.minU.toFixed(3)}-${uv.maxU.toFixed(3)}, ${uv.minV.toFixed(3)}-${uv.maxV.toFixed(3)}], Coverage: ${uv.coverage.toFixed(1)}%, Normalized: ${uv.isNormalized ? "" : ""}`);
  });
  console.groupEnd();

  // Warnings
  if (analysis.warnings.length > 0) {
    console.group(" Warnings");
    analysis.warnings.forEach((w) => console.warn(w));
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Get a simplified parts list for UI display
 */
export function getModelParts(scene: THREE.Object3D): {
  id: string;
  name: string;
  displayName: string;
  type: "mesh" | "material";
  color?: string;
  category?: string;
}[] {
  const parts: ReturnType<typeof getModelParts> = [];
  const processedMaterials = new Set<string>();

  scene.traverse((node) => {
    if (node instanceof THREE.Mesh && node.material) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];

      materials.forEach((mat) => {
        if (processedMaterials.has(mat.name || mat.uuid)) return;
        processedMaterials.add(mat.name || mat.uuid);

        let color: string | undefined;
        if (mat instanceof THREE.MeshStandardMaterial) {
          color = "#" + mat.color.getHexString();
        }

        // Parse display name
        const displayName = parsePartName(mat.name || node.name);
        const category = categorizePartName(displayName);

        parts.push({
          id: mat.name || mat.uuid,
          name: mat.name || node.name || "unnamed",
          displayName,
          type: "material",
          color,
          category,
        });
      });
    }
  });

  return parts;
}

/**
 * Parse technical part name into human-readable display name
 */
function parsePartName(name: string): string {
  if (!name) return "Part";

  return name
    // Remove common prefixes
    .replace(/^(mat_|material_|mtl_|mesh_|obj_|fabric_)/i, "")
    // Remove numeric suffixes
    .replace(/[._-]\d+$/i, "")
    // Replace separators with spaces
    .replace(/[._-]/g, " ")
    // Split camelCase
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Capitalize words
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    // Expand abbreviations
    .replace(/\bL\b/g, "Left")
    .replace(/\bR\b/g, "Right")
    .replace(/\bF\b/g, "Front")
    .replace(/\bB\b/g, "Back")
    || "Part";
}

/**
 * Categorize part name for grouping
 */
function categorizePartName(displayName: string): string {
  const lower = displayName.toLowerCase();

  if (lower.includes("jersey") || lower.includes("body") || lower.includes("front") || lower.includes("back")) {
    return "Jersey";
  }
  if (lower.includes("sleeve")) {
    return "Sleeves";
  }
  if (lower.includes("collar") || lower.includes("neck")) {
    return "Collar";
  }
  if (lower.includes("short") || lower.includes("pant") || lower.includes("waist")) {
    return "Shorts";
  }
  if (lower.includes("trim") || lower.includes("stripe") || lower.includes("piping")) {
    return "Trim";
  }
  if (lower.includes("button") || lower.includes("zipper")) {
    return "Accessories";
  }

  return "Other";
}

/**
 * Export analysis as JSON for debugging
 */
export function exportAnalysisJSON(analysis: ModelAnalysis): string {
  return JSON.stringify(analysis, null, 2);
}

export default analyzeModel;
