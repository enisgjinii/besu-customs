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

    // Responsive canvas size
    const canvasSize = Math.min(window.innerWidth - 100, 600)
    const canvas = new Canvas(canvasRef.current, {
      width: canvasSize,
      height: canvasSize,
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
      <div className="p-3 border-b border-border/50 space-y-2">
        <h3 className="font-semibold text-xs truncate">
          {isCompleteView ? "Complete UV Map" : `${selectedSection?.name || "UV Editor"}`}
        </h3>

        <div className="grid grid-cols-3 gap-1.5">
          <Button size="sm" variant="outline" onClick={addText} className="h-8 px-2">
            <Type className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs">Text</span>
          </Button>
          <Button size="sm" variant="outline" onClick={addImage} className="h-8 px-2">
            <ImageIcon className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs">Image</span>
          </Button>
          <Button size="sm" variant="outline" onClick={deleteSelected} className="h-8 px-2">
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs">Delete</span>
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <Button size="sm" variant="outline" onClick={undo} disabled={historyStep <= 0} className="h-8 px-2">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={redo} disabled={historyStep >= history.length - 1} className="h-8 px-2">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={clearCanvas} className="h-8 px-2">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={exportTexture} className="h-8 px-2">
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>

        {!isCompleteView && (
          <Button size="sm" onClick={applyToModel} className="w-full h-8 text-xs">
            Apply to Model
          </Button>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      <div className="flex-1 overflow-auto p-2 bg-secondary/10">
        <div className="flex items-center justify-center min-h-full">
          {uvMapUrl ? (
            <canvas ref={canvasRef} className="shadow-md rounded-sm border border-border max-w-full h-auto" />
          ) : (
            <div className="text-center text-muted-foreground px-4">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-xs">
                {sections.length === 0 ? "Load a 3D model" : "Select a material or wait for UV extraction"}
              </p>
            </div>
          )}
        </div>
      </div>

      {!uvMapUrl && !isCompleteView && (
        <div className="p-2 bg-muted/30 text-[10px] text-muted-foreground border-t border-border/50">
          {completeUVMap ? "Select a material to edit" : "UV map will be extracted automatically"}
        </div>
      )}

      {isCompleteView && (
        <div className="p-2 bg-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400 border-t border-border/50">
          Complete UV map. Select a material to edit specific textures.
        </div>
      )}
    </div>
  )
}
