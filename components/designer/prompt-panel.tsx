"use client";

import { useState } from "react";
import {
  Alert, Button, Card, CardContent, Chip, CircularProgress, FormControl,
  FormLabel, InputLabel, MenuItem, Select,
  Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignStyle, GarmentType } from "@/lib/designer/types";
import { ColorControl } from "./color-control";

export function PromptPanel() {
  const s = useDesignerStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mockMode, setMockMode] = useState(false);

  function friendlyError(code?: string, fallback?: string) {
    const messages: Record<string, string> = {
      missing_openai_key: "AI generation is not configured yet. Add the production OpenAI key, or enable mock mode for local testing.",
      storage_not_configured: "Artwork storage is not configured yet. Add the Supabase URL, service key, and assets bucket.",
      invalid_previous_asset: "This artwork revision is no longer available. Generate the side again before requesting a correction.",
      rate_limited: "Generation is temporarily busy. Wait a moment and try again.",
      generation_timeout: "Generation took too long. Try a simpler brief or try again.",
      upstream_error: "The image service could not complete this request. Try again in a moment.",
    };
    return (code && messages[code]) || fallback || "Artwork generation failed. Please try again.";
  }

  async function generate() {
    setError(""); setBusy(true);
    try {
      const response = await fetch("/api/designer/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentType: s.garmentType, designDescription: s.prompt, teamName: s.teamName, colors: s.colors, style: s.style, view: s.view, correction: s.correction || undefined, previousAssetUrl: s.artwork[s.view], requestId: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(friendlyError(data.code, data.error));
      setMockMode(Boolean(data.mock));
      s.addVersion({ id: data.id, prompt: s.prompt, correction: s.correction || undefined, colors: s.colors, assetUrl: data.assetUrl, createdAt: data.createdAt, garmentType: s.garmentType, view: s.view });
      s.setStep(1);
    } catch (e) { setError(e instanceof Error ? e.message : "Artwork generation failed. Please try again."); }
    finally { setBusy(false); }
  }

  return <Card component="section">
    <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2.5 } }}>
      <Typography fontWeight={800} mb={2}>Brief</Typography>
      {mockMode && <Alert severity="info" sx={{ mb: 2 }}>Preview mode — artwork is simulated and is not production artwork.</Alert>}

      <FormLabel sx={{ fontSize: 12, fontWeight: 700 }}>Garment</FormLabel>
      <ToggleButtonGroup exclusive fullWidth size="small" value={s.garmentType} onChange={(_, v: GarmentType | null) => v && s.setGarment(v)} sx={{ my: 1 }}>
        <ToggleButton value="jersey">Jersey</ToggleButton><ToggleButton value="shorts">Shorts</ToggleButton><ToggleButton value="uniform">Uniform</ToggleButton>
      </ToggleButtonGroup>

      <Stack direction="row" spacing={1.5} mt={2}>
        <FormControl><InputLabel>Sport</InputLabel><Select value={s.sport} label="Sport" onChange={(e) => s.patch({ sport: e.target.value })}><MenuItem value="Basketball">Basketball</MenuItem><MenuItem value="Soccer">Soccer</MenuItem><MenuItem value="Volleyball">Volleyball</MenuItem><MenuItem value="Baseball">Baseball</MenuItem><MenuItem value="Flag Football">Flag football</MenuItem></Select></FormControl>
        <FormControl><InputLabel>Style</InputLabel><Select value={s.style} label="Style" onChange={(e) => s.patch({ style: e.target.value as DesignStyle })}>{["modern","minimal","geometric","retro","aggressive"].map(v => <MenuItem value={v} key={v} sx={{ textTransform: "capitalize" }}>{v}</MenuItem>)}</Select></FormControl>
      </Stack>

      <TextField sx={{ mt: 2 }} label="Team" value={s.teamName} onChange={(e) => s.patch({ teamName: e.target.value.toUpperCase().slice(0, 60) })} placeholder="BESU ELITE" />
      <TextField sx={{ mt: 2 }} label="Design" value={s.prompt} onChange={(e) => s.patch({ prompt: e.target.value })} multiline minRows={4} maxRows={7} placeholder="Black uniform with angular gold side panels" inputProps={{ maxLength: 800 }} />

      <Typography variant="subtitle2" mt={2.5}>Colors</Typography>
      <Stack direction="row" spacing={1} mt={1}>{(["primary", "secondary", "accent"] as const).map(key => <ColorControl key={key} label={key} value={s.colors[key]} onChange={value => s.patch({ colors: { ...s.colors, [key]: value } })} />)}</Stack>

      {s.artwork[s.view] && <TextField sx={{ mt: 2 }} label={`Correction for ${s.view}`} value={s.correction} onChange={(e) => s.patch({ correction: e.target.value })} multiline minRows={2} placeholder="Keep the layout but make the side pattern smaller" inputProps={{ maxLength: 400 }} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Stack direction="row" spacing={1} mt={2}>
        <Chip size="small" variant={s.artwork.front ? "filled" : "outlined"} label={s.artwork.front ? "Front ready" : "Front missing"} />
        <Chip size="small" variant={s.artwork.back ? "filled" : "outlined"} label={s.artwork.back ? "Back ready" : "Back missing"} />
      </Stack>
      <Button fullWidth size="large" variant="contained" startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeRounded />} disabled={busy || s.prompt.trim().length < 8 || !s.teamName.trim()} onClick={generate} sx={{ mt: 2.5 }}>
        {busy ? "Creating artwork…" : s.artwork[s.view] ? `Generate ${s.view} revision` : `Generate ${s.view} artwork`}
      </Button>
    </CardContent>
  </Card>;
}
