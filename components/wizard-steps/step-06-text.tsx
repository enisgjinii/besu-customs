"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Type, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import { TextureLayerSelector } from "@/components/texture-layer-selector";
import { debounce } from "@/lib/mobile-performance-utils";
// (no extra utils needed)

// 200 Popular Google Fonts
const FONT_FAMILIES = [
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Source Sans Pro",
  "Raleway",
  "PT Sans",
  "Roboto Condensed",
  "Merriweather",
  "Poppins",
  "Ubuntu",
  "Playfair Display",
  "Roboto Slab",
  "Noto Sans",
  "Fira Sans",
  "Titillium Web",
  "Work Sans",
  "Nunito",
  "PT Serif",
  "Mukta",
  "Rubik",
  "Libre Baskerville",
  "Oxygen",
  "Inconsolata",
  "Quicksand",
  "Nunito Sans",
  "Arimo",
  "Bitter",
  "Dosis",
  "Heebo",
  "Cabin",
  "Karla",
  "Crimson Text",
  "Barlow",
  "Libre Franklin",
  "Anton",
  "Indie Flower",
  "Hind",
  "Abel",
  "Josefin Sans",
  "Archivo",
  "Varela Round",
  "Lobster",
  "Pacifico",
  "Abril Fatface",
  "IBM Plex Sans",
  "Righteous",
  "Manrope",
  "Kanit",
  "Bebas Neue",
  "Exo 2",
  "Nanum Gothic",
  "Barlow Condensed",
  "Dancing Script",
  "Caveat",
  "Comfortaa",
  "Zilla Slab",
  "Yanone Kaffeesatz",
  "Asap",
  "Prompt",
  "Permanent Marker",
  "Amatic SC",
  "Shadows Into Light",
  "DM Sans",
  "Signika",
  "Questrial",
  "Play",
  "Satisfy",
  "Catamaran",
  "Archivo Narrow",
  "Noticia Text",
  "Fjalla One",
  "Patua One",
  "Hind Siliguri",
  "Maven Pro",
  "Acme",
  "Teko",
  "Noto Serif",
  "Russo One",
  "Assistant",
  "Arvo",
  "Bree Serif",
  "Sarabun",
  "Passion One",
  "Alfa Slab One",
  "Electrolize",
  "Sacramento",
  "Great Vibes",
  "Kalam",
  "Cinzel",
  "Tinos",
  "Poiret One",
  "ABeeZee",
  "Courgette",
  "Special Elite",
  "Architects Daughter",
  "Pathway Gothic One",
  "Sigmar One",
  "Yellowtail",
  "Crete Round",
  "Concert One",
  "Bangers",
  "Gloria Hallelujah",
  "Patrick Hand",
  "Marck Script",
  "Fira Mono",
  "Space Mono",
  "Audiowide",
  "Orbitron",
  "Paytone One",
  "Francois One",
  "Press Start 2P",
  "Fugaz One",
  "Monoton",
  "Source Code Pro",
  "Lora",
  "Noto Sans JP",
  "Roboto Mono",
  "PT Sans Narrow",
  "Kaushan Script",
  "Encode Sans",
  "Rajdhani",
  "Squada One",
  "Cookie",
  "Aleo",
  "Cardo",
  "Sanchez",
  "Vollkorn",
  "Shrikhand",
  "Fredoka One",
  "Hammersmith One",
  "Cormorant Garamond",
  "Lexend Deca",
  "Mulish",
  "Secular One",
  "Allura",
  "EB Garamond",
  "Spectral",
  "Neuton",
  "Aldrich",
  "Philosopher",
  "Cinzel Decorative",
  "Lilita One",
  "Saira Condensed",
  "Mate",
  "Ropa Sans",
  "Chivo",
  "Quantico",
  "BenchNine",
  "Tajawal",
  "Overpass",
  "Adamina",
  "Rancho",
  "Black Ops One",
  "Bungee",
  "Staatliches",
  "Economica",
  "Alegreya",
  "Gentium Basic",
  "Amiri",
  "Gothic A1",
  "Faustina",
  "Ultra",
  "Istok Web",
  "Cuprum",
  "Arapey",
  "Lustria",
  "Prata",
  "Cambay",
  "Eczar",
  "Marcellus",
  "Federo",
  "Enriqueta",
  "Tenor Sans",
  "Basic",
  "Gudea",
  "Convergence",
  "Oxygen Mono",
  "Quattrocento",
  "Judson",
  "Vidaloka",
  "Forum",
  "Jost",
  "Red Hat Display",
  "Sora",
  "Inter",
  "Outfit",
  "Space Grotesk",
  "Figtree",
  "Urbanist",
];

export function Step06Text() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const updateTextureLayer = useConfiguratorStore(
    (state) => state.updateTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);

  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(100);
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [textCurvature, setTextCurvature] = useState(0);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  // Remove font search popover state; using plain Select

  // Debounced update for better mobile performance
  const debouncedUpdate = useCallback(
    debounce((id: string, updates: any) => {
      updateTextureLayer(id, updates);
    }, 150),
    [updateTextureLayer],
  );

  // Load Google Fonts dynamically
  useEffect(() => {
    const link = document.getElementById(
      "google-fonts-link",
    ) as HTMLLinkElement;
    if (!link) {
      const newLink = document.createElement("link");
      newLink.id = "google-fonts-link";
      newLink.rel = "stylesheet";
      newLink.href = `https://fonts.googleapis.com/css2?family=${FONT_FAMILIES.map((f) => f.replace(/ /g, "+")).join("&family=")}&display=swap`;
      document.head.appendChild(newLink);
    }
  }, []);

  const handleAddText = () => {
    if (!textInput.trim()) return;

    const newLayer = {
      id: uuidv4(),
      name: `Text: ${textInput}`,
      type: "text" as const,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal" as const,
      order: textureLayers.length + 1,
      text: textInput,
      textColor: textColor,
      fontSize: fontSize,
      fontFamily: fontFamily,
      position: [0.5, 0.5, 0] as [number, number, number], // Center (chest area)
      rotation: [0, 0, textCurvature] as [number, number, number], // Use rotation Z for curvature
      scale: [1, 1, 1] as [number, number, number],
    };

    addTextureLayer(newLayer);
    setSelectedTextId(newLayer.id);
    setTextInput("");
    toast.success("Text added! Edit properties below");
  };

  const textLayers = textureLayers.filter((l) => l.type === "text");
  const selectedLayer = textLayers.find((l) => l.id === selectedTextId);

  return (
    <div className="space-y-4">
      {/* Texture Layer Selector - Shows what's selected */}
      {textureLayers.length > 0 && <TextureLayerSelector />}

      {/* Quick Add Section */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Add Text</Label>
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              onKeyDown={(e) => e.key === "Enter" && handleAddText()}
              className="h-9 text-sm"
            />
          </div>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-10 h-9 p-1 border rounded cursor-pointer shrink-0"
          />
          <Button
            onClick={handleAddText}
            size="icon"
            className="h-9 w-9 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Text Layers List */}
      {textLayers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Your Text Layers ({textLayers.length})
          </Label>
          <div className="space-y-2">
            {textLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setSelectedTextId(layer.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTextId === layer.id
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:bg-muted/50"
                  }`}
              >
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{ backgroundColor: layer.textColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {layer.text || layer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {layer.fontSize}px • {fontFamily}
                      </p>
                    </div>
                  </div>
                  {selectedTextId === layer.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTextureLayer(layer.id, { opacity: 0 });
                        setSelectedTextId(null);
                        toast.success("Text removed");
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Show controls when selected */}
                {selectedTextId === layer.id && (
                  <div className="mt-2 pt-2 border-t space-y-2">
                    {/* Font Family - shadcn Select */}
                    <div className="space-y-1">
                      <Label className="text-xs">Font</Label>
                      <Select
                        value={layer.fontFamily || "Roboto"}
                        onValueChange={(val) =>
                          updateTextureLayer(layer.id, { fontFamily: val })
                        }
                      >
                        <SelectTrigger
                          className="h-8 text-sm"
                          style={{ fontFamily: layer.fontFamily || "Roboto" }}
                        >
                          <SelectValue placeholder="Choose font" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {FONT_FAMILIES.map((font) => (
                            <SelectItem
                              key={font}
                              value={font}
                              className="text-foreground"
                              style={{ fontFamily: font }}
                            >
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Color and Size */}
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={layer.textColor || "#000000"}
                        onChange={(e) =>
                          updateTextureLayer(layer.id, {
                            textColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 p-1 border rounded cursor-pointer"
                      />
                      <Slider
                        value={[layer.fontSize || 100]}
                        onValueChange={(v) =>
                          updateTextureLayer(layer.id, { fontSize: v[0] })
                        }
                        min={20}
                        max={300}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right pt-1">
                        {layer.fontSize}px
                      </span>
                    </div>

                    {/* Text Curvature */}
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Curve:{" "}
                        {layer.rotation?.[2]
                          ? Math.round((layer.rotation[2] * 180) / Math.PI)
                          : 0}
                        °
                      </Label>
                      <Slider
                        value={[
                          layer.rotation?.[2]
                            ? (layer.rotation[2] * 180) / Math.PI
                            : 0,
                        ]}
                        onValueChange={(v) => {
                          const radians = (v[0] * Math.PI) / 180;
                          updateTextureLayer(layer.id, {
                            rotation: [0, 0, radians] as [
                              number,
                              number,
                              number,
                            ],
                          });
                        }}
                        min={-45}
                        max={45}
                        step={2}
                        className="flex-1"
                      />
                    </div>

                    {/* Position Control */}
                    <div className="space-y-1">
                      <Label className="text-xs">Position on Jersey</Label>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          size="sm"
                          variant={
                            layer.position?.[1] === 0.15 ? "default" : "outline"
                          }
                          onClick={() =>
                            updateTextureLayer(layer.id, {
                              position: [0.5, 0.15, 0] as [
                                number,
                                number,
                                number,
                              ],
                            })
                          }
                          className="text-xs h-7"
                        >
                          Top
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            layer.position?.[1] === 0.35 ? "default" : "outline"
                          }
                          onClick={() =>
                            updateTextureLayer(layer.id, {
                              position: [0.5, 0.35, 0] as [
                                number,
                                number,
                                number,
                              ],
                            })
                          }
                          className="text-xs h-7"
                        >
                          Chest
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            layer.position?.[1] === 0.55 ? "default" : "outline"
                          }
                          onClick={() =>
                            updateTextureLayer(layer.id, {
                              position: [0.5, 0.55, 0] as [
                                number,
                                number,
                                number,
                              ],
                            })
                          }
                          className="text-xs h-7"
                        >
                          Stomach
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <Button
                          size="sm"
                          variant={
                            layer.position?.[0] === 0.25 ? "default" : "outline"
                          }
                          onClick={() =>
                            updateTextureLayer(layer.id, {
                              position: [
                                0.25,
                                layer.position?.[1] || 0.35,
                                0,
                              ] as [number, number, number],
                            })
                          }
                          className="text-xs h-7"
                        >
                          Left
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            layer.position?.[0] === 0.75 ? "default" : "outline"
                          }
                          onClick={() =>
                            updateTextureLayer(layer.id, {
                              position: [
                                0.75,
                                layer.position?.[1] || 0.35,
                                0,
                              ] as [number, number, number],
                            })
                          }
                          className="text-xs h-7"
                        >
                          Right
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
