"use client";

import { useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Divider, FormControl, InputLabel,
  MenuItem, Select, Slider, Stack, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import CenterFocusStrongRounded from "@mui/icons-material/CenterFocusStrongRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import { useDesignerStore } from "@/lib/designer/store";

type Layer = "artwork" | "text";

export function ArtworkControls() {
  const s = useDesignerStore();
  const [layer, setLayer] = useState<Layer>("artwork");
  const artwork = s.transforms[s.view];
  const text = s.textTransforms[s.view];
  const rows = layer === "artwork" ? [
    { key: "scale" as const, label: "Scale", value: artwork.scale, min: .55, max: 1.35, step: .01, text: `${Math.round(artwork.scale * 100)}%` },
    { key: "x" as const, label: "Horizontal", value: artwork.x, min: -100, max: 100, step: 1, text: `${artwork.x}px` },
    { key: "y" as const, label: "Vertical", value: artwork.y, min: -100, max: 100, step: 1, text: `${artwork.y}px` },
    { key: "rotation" as const, label: "Rotation", value: artwork.rotation, min: -12, max: 12, step: 1, text: `${artwork.rotation}°` },
  ] : [
    { key: "scale" as const, label: "Text size", value: text.scale, min: .65, max: 1.25, step: .01, text: `${Math.round(text.scale * 100)}%` },
    { key: "x" as const, label: "Horizontal", value: text.x, min: -35, max: 35, step: 1, text: `${text.x}px` },
    { key: "y" as const, label: "Vertical", value: text.y, min: -55, max: 55, step: 1, text: `${text.y}px` },
  ];

  function update(key: "scale" | "x" | "y" | "rotation", value: number) {
    if (layer === "artwork") s.setTransform({ [key]: value });
    else if (key !== "rotation") s.setTextTransform({ [key]: value });
  }

  function reset() {
    if (layer === "artwork") s.setTransform({ scale: 1, x: 0, y: 0, rotation: 0 });
    else s.setTextTransform({ scale: 1, x: 0, y: 0 });
  }

  function safeFit() {
    if (layer === "artwork") s.setTransform({ scale: .82, x: 0, y: 0, rotation: 0 });
    else s.setTextTransform({ scale: .9, x: 0, y: 0 });
  }

  return <Card component="section">
    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}><Typography fontWeight={800}>Placement</Typography><Chip size="small" label={s.view} sx={{ textTransform: "capitalize" }} /></Stack>
      <ToggleButtonGroup exclusive fullWidth size="small" value={layer} onChange={(_, value: Layer | null) => value && setLayer(value)} sx={{ mb: 2 }}><ToggleButton value="artwork">Artwork</ToggleButton><ToggleButton value="text">Text</ToggleButton></ToggleButtonGroup>

      {layer === "text" && <FormControl sx={{ mb: 2 }}><InputLabel>Font</InputLabel><Select label="Font" value={s.font} onChange={e => s.patch({ font: e.target.value })}><MenuItem value="Inter, sans-serif">Athletic sans</MenuItem><MenuItem value="Impact, sans-serif">Impact</MenuItem><MenuItem value="Georgia, serif">Classic serif</MenuItem><MenuItem value="monospace">Block mono</MenuItem></Select></FormControl>}

      <Stack spacing={1.6}>{rows.map(row => <Box key={row.key}>
        <Stack direction="row" justifyContent="space-between"><Typography variant="caption" fontWeight={700}>{row.label}</Typography><Typography variant="caption" color="text.secondary">{row.text}</Typography></Stack>
        <Slider size="small" value={row.value} min={row.min} max={row.max} step={row.step} onChange={(_, value) => update(row.key, value as number)} aria-label={`${layer} ${row.label}`} />
      </Box>)}</Stack>

      <Stack direction="row" spacing={1} mt={1}><Button fullWidth variant="outlined" startIcon={<RestartAltRounded />} onClick={reset}>Reset</Button><Button fullWidth variant="outlined" startIcon={<CenterFocusStrongRounded />} onClick={safeFit}>Safe fit</Button></Stack>

      {s.history.length > 0 && <><Divider sx={{ my: 2.5 }} /><Stack direction="row" spacing={1} alignItems="center" mb={1.5}><HistoryRounded fontSize="small" /><Typography variant="subtitle2">Versions</Typography><Chip size="small" label={`${s.history.length}/8`} /></Stack><Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1 }}>{s.history.map((version, index) => <Box component="button" key={version.id} onClick={() => s.restoreVersion(version)} sx={{ p: .5, minWidth: 76, bgcolor: "#fff", border: "1px solid", borderColor: version.id === s.designId ? "#000" : "#ddd", cursor: "pointer", textAlign: "left" }}><Box component="img" src={version.assetUrl} alt={`Version ${s.history.length - index}`} sx={{ display: "block", width: 66, height: 58, objectFit: "cover", bgcolor: "#f2f2f2" }} /><Typography variant="caption" noWrap display="block">v{s.history.length - index}</Typography></Box>)}</Stack></>}
    </CardContent>
  </Card>;
}
