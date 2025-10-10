"use client"

import { useEffect, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { useConfiguratorStore } from "@/lib/store"
import { extractSections, applyMaterialUpdates, getMeshByMaterialId } from "@/lib/model-utils"
import { extractUVMap } from "@/lib/uv-utils"
import * as THREE from "three"

export function ModelLoader() {
  const uploadedModel = useConfiguratorStore((state) => state.uploadedModel)
  const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl)
  const sections = useConfiguratorStore((state) => state.sections)
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

  return <Model url={effectiveUrl} />
}

function Model({ url }: { url: string }) {
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

  return <LoadedModel url={url} />
}

function LoadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const sections = useConfiguratorStore((state) => state.sections)
  const setSections = useConfiguratorStore((state) => state.setSections)
  const setUVMap = useConfiguratorStore((state) => state.setUVMap)
  const clonedScene = useRef(scene.clone())

  // Extract sections on load
  useEffect(() => {
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
  }, [url, setSections, setUVMap])

  // Apply material updates
  useEffect(() => {
    applyMaterialUpdates(clonedScene.current, sections)
  }, [sections])

  return <primitive object={clonedScene.current} />
}
