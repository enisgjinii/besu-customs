"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Canvas, IText, Image as FabricImage } from "fabric"
import { useConfiguratorStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ImageIcon, Type, Download, Trash2, Undo2, Redo2, Layers } from "lucide-react"

export function UVEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<Canvas | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [history, setHistory] = useState<string[]>([])
  const [historyStep, setHistoryStep] = useState(-1)

  const selectedSectionId = useConfiguratorStore((state) => state.selectedSectionId)
  const sections = useConfiguratorStore((state) => state.sections)
  const updateSection = useConfiguratorStore((state) => state.updateSection)
  const uvMaps = useConfiguratorStore((state) => state.uvMaps)
  const completeUVMap = useConfiguratorStore((state) => (state as any).completeUVMap)

  const selectedSection = sections.find((s) => s.id === selectedSectionId)
  // Use complete UV map if no section is selected, otherwise use section-specific UV map
  const uvMapUrl = selectedSectionId ? uvMaps.get(selectedSectionId) : completeUVMap

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 800,
      backgroundColor: "#ffffff",
    })

    fabricCanvasRef.current = canvas

    // Save state on object modification
    canvas.on("object:modified", saveState)
    canvas.on("object:added", saveState)

    return () => {
      canvas.dispose()
    }
  }, [])

  // Load UV map as background when available
  useEffect(() => {
    if (!fabricCanvasRef.current || !uvMapUrl) return

    // Clear any existing background first
    fabricCanvasRef.current.backgroundImage = undefined
    fabricCanvasRef.current.renderAll()

    FabricImage.fromURL(uvMapUrl, {
      crossOrigin: "anonymous",
    })
      .then((img) => {
        if (!fabricCanvasRef.current) return

        img.set({
          selectable: false,
          evented: false,
          opacity: 1,
          scaleX: fabricCanvasRef.current.width! / (img.width || 1),
          scaleY: fabricCanvasRef.current.height! / (img.height || 1),
        })

        fabricCanvasRef.current.backgroundImage = img
        fabricCanvasRef.current.renderAll()
      })
      .catch((err) => {
        console.error("Failed to load UV map:", err)
      })
  }, [uvMapUrl])

  const saveState = () => {
    if (!fabricCanvasRef.current) return
    const json = JSON.stringify(fabricCanvasRef.current.toJSON())
    setHistory((prev) => [...prev.slice(0, historyStep + 1), json])
    setHistoryStep((prev) => prev + 1)
  }

  const undo = () => {
    if (historyStep > 0 && fabricCanvasRef.current) {
      setHistoryStep((prev) => prev - 1)
      fabricCanvasRef.current.loadFromJSON(history[historyStep - 1], () => {
        fabricCanvasRef.current?.renderAll()
      })
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1 && fabricCanvasRef.current) {
      setHistoryStep((prev) => prev + 1)
      fabricCanvasRef.current.loadFromJSON(history[historyStep + 1], () => {
        fabricCanvasRef.current?.renderAll()
      })
    }
  }

  const addText = () => {
    if (!fabricCanvasRef.current) return

    const text = new IText("Edit Text", {
      left: 100,
      top: 100,
      fontSize: 40,
      fill: "#000000",
      fontFamily: "Arial",
    })

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    saveState()
  }

  const addImage = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricCanvasRef.current) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string

  ;(FabricImage as any).fromURL(imgUrl, (img: any) => {
        if (!fabricCanvasRef.current) return

        img.scaleToWidth(200)
        img.set({
          left: 100,
          top: 100,
        })

        fabricCanvasRef.current.add(img)
        fabricCanvasRef.current.setActiveObject(img)
        saveState()
      })
    }
    reader.readAsDataURL(file)
  }

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return
    fabricCanvasRef.current.clear()
    fabricCanvasRef.current.backgroundColor = "#ffffff"
    saveState()
  }

  const applyToModel = () => {
    if (!fabricCanvasRef.current || !selectedSectionId) return

    const dataUrl = (fabricCanvasRef.current as any).toDataURL({
      multiplier: 1,
      format: "png",
      quality: 1,
    })

    updateSection(selectedSectionId, { customTexture: dataUrl })
  }

  const exportTexture = () => {
    if (!fabricCanvasRef.current) return

    const dataUrl = (fabricCanvasRef.current as any).toDataURL({
      multiplier: 1,
      format: "png",
      quality: 1,
    })

    const link = document.createElement("a")
    link.download = `texture-${selectedSection?.name || "export"}.png`
    link.href = dataUrl
    link.click()
  }

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject)
      saveState()
    }
  }

  // Show complete UV map if no section is selected
  const isCompleteView = !selectedSection && completeUVMap

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50 space-y-3">
        <h3 className="font-semibold text-sm">
          {isCompleteView ? "Complete Model UV Map" : `UV Texture Editor: ${selectedSection?.name}`}
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" onClick={addText}>
            <Type className="w-4 h-4 mr-1.5" />
            Text
          </Button>
          <Button size="sm" variant="outline" onClick={addImage}>
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Image
          </Button>
          <Button size="sm" variant="outline" onClick={deleteSelected}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button size="sm" variant="outline" onClick={undo} disabled={historyStep <= 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={redo} disabled={historyStep >= history.length - 1}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={exportTexture}>
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {!isCompleteView && (
          <Button size="sm" onClick={applyToModel} className="w-full">
            Apply to 3D Model
          </Button>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      <div className="flex-1 overflow-auto p-4 bg-secondary/10">
        <div className="flex items-center justify-center min-h-full">
          {uvMapUrl ? (
            <canvas ref={canvasRef} className="shadow-lg rounded-sm border-2 border-border" />
          ) : (
            <div className="text-center text-muted-foreground">
              <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-sm">
                {sections.length === 0 ? "Load a 3D model to see UV map" : "Select a material section or wait for UV extraction"}
              </p>
            </div>
          )}
        </div>
      </div>

      {!uvMapUrl && !isCompleteView && (
        <div className="p-3 bg-muted/30 text-xs text-muted-foreground border-t border-border/50">
          {completeUVMap ? "Select a material section to edit its texture" : "UV map will be extracted automatically when the model is loaded"}
        </div>
      )}

      {isCompleteView && (
        <div className="p-3 bg-blue-500/10 text-xs text-blue-600 dark:text-blue-400 border-t border-border/50">
          This is the complete UV map of your entire 3D model. Select a material section to edit specific textures.
        </div>
      )}
    </div>
  )
}
