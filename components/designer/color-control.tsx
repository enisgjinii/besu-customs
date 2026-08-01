"use client";

import { useState } from "react";
import { Box, Button, Popover, Stack, TextField, Typography } from "@mui/material";

const swatches = ["#000000", "#FFFFFF", "#D4AF37", "#C8102E", "#0033A0", "#006341", "#FF6A00", "#6A1B9A"];

export function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState(value);
  function apply(next: string) { if (/^#[0-9a-f]{6}$/i.test(next)) { onChange(next); setDraft(next.toUpperCase()); } }
  return <>
    <Button variant="outlined" onClick={event => { setDraft(value.toUpperCase()); setAnchor(event.currentTarget); }} sx={{ flex: 1, minWidth: 0, justifyContent: "flex-start", px: 1 }}>
      <Box sx={{ width: 18, height: 18, bgcolor: value, border: "1px solid #aaa", mr: 1, flexShrink: 0 }} />
      <Typography variant="caption" noWrap sx={{ textTransform: "capitalize" }}>{label}</Typography>
    </Button>
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
      <Box sx={{ width: 240, p: 2 }}><Typography fontWeight={800} mb={1.5} textTransform="capitalize">{label}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>{swatches.map(color => <Box component="button" key={color} aria-label={color} onClick={() => { apply(color); setAnchor(null); }} sx={{ height: 38, bgcolor: color, border: color === value ? "3px solid #000" : "1px solid #bbb", cursor: "pointer" }} />)}</Box>
        <Stack direction="row" spacing={1} mt={2}><TextField label="Hex" value={draft} onChange={e => setDraft(e.target.value.toUpperCase())} inputProps={{ maxLength: 7 }} /><Button variant="contained" onClick={() => { apply(draft); setAnchor(null); }}>Set</Button></Stack>
      </Box>
    </Popover>
  </>;
}
