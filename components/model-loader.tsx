"use client"

import { useEffect, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { useConfiguratorStore } from "@/lib/store"
import { extractSections, applyMaterialUpdates, getMeshByMaterialId } from "@/lib/model-utils"
import { extractUVMap } from "@/lib/uv-utils"
import * as THREE from "three"

export function ModelLoader({ controlsRef }: { controlsRef?: any }) {
  const uploadedModel = useConfiguratorStore((state) => state.uploadedModel)
  const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl)
  const setCurrentModelUrl = useConfiguratorStore((state) => state.setCurrentModelUrl)

  // Handle uploaded file
  useEffect(() => {
    if (uploadedModel) {
      const url = URL.createObjectURL(uploadedModel)
      setCurrentModelUrl(url)

      return () => URL.revokeObjectURL(url)
    }
  }, [uploadedModel, setCurrentModelUrl])

  // Use placeholder cube if no model
  const effectiveUrl = currentModelUrl || "/placeholder-model.glb"

  return <Model url={effectiveUrl} controlsRef={controlsRef} />
}

function Model({ url, controlsRef }: { url: string; controlsRef?: any }) {
  const sections = useConfiguratorStore((state) => state.sections)
  const setSections = useConfiguratorStore((state) => state.setSections)
  const setUVMap = useConfiguratorStore((state) => state.setUVMap)
  const groupRef = useRef<THREE.Group>(null)

  // Load placeholder cube if URL doesn't exist
  const isPlaceholder = url === "/placeholder-model.glb"

  useEffect(() => {
    if (isPlaceholder && groupRef.current) {
      // Create a simple cube as placeholder
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshStandardMaterial({
        color: "#3b82f6",
        roughness: 0.5,
        metalness: 0.5,
      })
      const cube = new THREE.Mesh(geometry, material)

      groupRef.current.clear()
      groupRef.current.add(cube)

      // Extract sections from placeholder
      const newSections = extractSections(groupRef.current)
      setSections(newSections)

      newSections.forEach((section) => {
        const mesh = getMeshByMaterialId(groupRef.current!, section.id)
        if (mesh) {
          const uvMapUrl = extractUVMap(mesh)
          if (uvMapUrl) {
            setUVMap(section.id, uvMapUrl)
          }
        }
      })
    }
  }, [isPlaceholder, setSections, setUVMap])

  if (isPlaceholder) {
    return <group ref={groupRef} />
  }

  return <LoadedModel url={url} controlsRef={controlsRef} />
}

function LoadedModel({ url, controlsRef }: { url: string; controlsRef?: any }) {
  const { scene } = useGLTF(url)
  const sections = useConfiguratorStore((state) => state.sections)
  const setSections = useConfiguratorStore((state) => state.setSections)
  const setUVMap = useConfiguratorStore((state) => state.setUVMap)
  const setModelLoading = useConfiguratorStore((state) => (state as any).setModelLoading)
  const setModelError = useConfiguratorStore((state) => (state as any).setModelError)
  const clonedScene = useRef(scene.clone())

  useEffect(() => {
    // refresh cloned scene when url changes
    clonedScene.current = scene.clone()
  }, [url, scene])

  // Extract sections on load and fit model to view
  useEffect(() => {
    setModelLoading(true)
    setModelError(null)

    try {
      const newSections = extractSections(clonedScene.current)
      setSections(newSections)

      newSections.forEach((section) => {
        const mesh = getMeshByMaterialId(clonedScene.current, section.id)
        if (mesh) {
          const uvMapUrl = extractUVMap(mesh)
          if (uvMapUrl) {
            setUVMap(section.id, uvMapUrl)
          }
        }
      })

      // Aggressive centering: compute bounding box and force center to origin
      const box = new THREE.Box3().setFromObject(clonedScene.current)
      const size = new THREE.Vector3()
      box.getSize(size)
      const center = new THREE.Vector3()
      box.getCenter(center)

      const maxDim = Math.max(size.x, size.y, size.z)

      // Force model center to exact origin (0, 0, 0)
      clonedScene.current.position.set(-center.x, -center.y, -center.z)

      // Scale to fit nicely in viewport (2.5 units for bigger models)
      if (maxDim > 0) {
        const desiredSize = 2.5 // larger target for bigger models
        const scale = desiredSize / maxDim
        clonedScene.current.scale.setScalar(scale)

        // Recalculate center after scaling
        const scaledBox = new THREE.Box3().setFromObject(clonedScene.current)
        const scaledCenter = new THREE.Vector3()
        scaledBox.getCenter(scaledCenter)

        // Apply correction to ensure perfect centering
        clonedScene.current.position.sub(scaledCenter)
      }

      // Lock controls to center with tighter constraints
      if (controlsRef && controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.minDistance = 0.5
        controlsRef.current.maxDistance = 8
        controlsRef.current.update()
      }

      setModelLoading(false)
    } catch (err) {
      console.warn("Fit-to-view failed:", err)
      setModelError(err instanceof Error ? err.message : "Failed to load model")
      setModelLoading(false)
    }
  }, [url, setSections, setUVMap, controlsRef, setModelLoading, setModelError])

  // Apply material updates
  useEffect(() => {
    applyMaterialUpdates(clonedScene.current, sections)
  }, [sections])

  return <primitive object={clonedScene.current} />
}
