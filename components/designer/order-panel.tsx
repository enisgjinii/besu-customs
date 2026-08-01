"use client";

import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Divider, FormControl,
  IconButton, InputLabel, MenuItem, Select, Snackbar, Stack, TextField, Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import LocalMallRounded from "@mui/icons-material/LocalMallRounded";
import RadioButtonUncheckedRounded from "@mui/icons-material/RadioButtonUncheckedRounded";
import { useDesignerStore } from "@/lib/designer/store";
import {
  downloadDesignerPng, downloadDesignerSvg, downloadProductionBundle,
  downloadProductionPdf, serializeDesignerSvg, type ProductionCaptures,
} from "@/lib/designer/export-service";
import { DESIGNER_SIZES, sendDesignerCheckout, validateCheckout } from "@/lib/designer/shopify-service";

function waitForPreview() {
  return new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function captureProductionViews() {
  const store = useDesignerStore.getState();
  const originalView = store.view;
  const captures = {} as ProductionCaptures;
  try {
    for (const view of ["front", "back"] as const) {
      useDesignerStore.getState().setView(view);
      await waitForPreview();
      captures[view] = serializeDesignerSvg();
    }
  } finally {
    useDesignerStore.getState().setView(originalView);
    await waitForPreview();
  }
  return captures;
}

export function OrderPanel({ mode = "roster" }: { mode?: "roster" | "review" }) {
  const s = useDesignerStore();
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const [exporting, setExporting] = useState<"png" | "svg" | "pdf" | "zip" | null>(null);
  const total = s.roster.reduce((sum, player) => sum + player.quantity, 0);
  const errors = useMemo(() => validateCheckout(s), [s]);
  const rosterReady = s.roster.length > 0 && s.roster.every(player => player.name.trim() && player.number.trim() && player.quantity > 0);
  const customerReady = Boolean(s.customer.name.trim() && /^\S+@\S+\.\S+$/.test(s.customer.email));
        const checks = [
          { label: "Design ID", ready: Boolean(s.designId) },
          { label: "Front artwork", ready: Boolean(s.artwork.front) },
    { label: "Back artwork", ready: Boolean(s.artwork.back) },
    { label: "Team", ready: Boolean(s.teamName.trim()) },
    { label: "Roster", ready: rosterReady },
    { label: "Customer", ready: customerReady },
  ];

  async function runExport(kind: "png" | "svg" | "pdf" | "zip") {
    setExporting(kind);
    try {
      if (kind === "png") {
        await downloadDesignerPng(s);
      } else if (kind === "svg") {
        downloadDesignerSvg(s);
      } else {
        const snapshot = useDesignerStore.getState();
        const captures = await captureProductionViews();
        if (kind === "pdf") await downloadProductionPdf(snapshot, captures);
        else await downloadProductionBundle(snapshot, captures);
      }
      setNotice({ severity: "success", text: `${kind.toUpperCase()} ready.` });
    } catch (error) {
      setNotice({ severity: "error", text: error instanceof Error ? error.message : "Export failed." });
    } finally {
      setExporting(null);
    }
  }

  function checkout() {
    const result = sendDesignerCheckout(s);
    setNotice(result.ok ? { severity: "success", text: "Sent to Shopify." } : { severity: "error", text: result.errors[0] });
  }

  return <Card component="section">
    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
      {mode === "roster" ? <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}><Typography fontWeight={800}>Roster</Typography><Typography variant="caption">{total} pieces</Typography></Stack>
        <Stack spacing={1.25}>{s.roster.map((player, index) => <Box key={player.id} sx={{ p: 1.25, border: "1px solid #dedede", bgcolor: "#fff" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}><Typography variant="caption" fontWeight={800}>PLAYER {index + 1}</Typography><IconButton size="small" aria-label={`Remove player ${index + 1}`} onClick={() => s.removePlayer(player.id)}><DeleteOutlineRounded fontSize="small" /></IconButton></Stack>
          <Stack direction="row" spacing={1}><TextField label="Name" value={player.name} onChange={e => s.updatePlayer(player.id, { name: e.target.value.slice(0, 18) })} inputProps={{ maxLength: 18 }} /><TextField label="#" value={player.number} onChange={e => s.updatePlayer(player.id, { number: e.target.value.replace(/\D/g, "").slice(0, 3) })} sx={{ maxWidth: 82 }} /></Stack>
          <Stack direction="row" spacing={1} mt={1}><FormControl><InputLabel>Top</InputLabel><Select label="Top" value={player.topSize} onChange={e => s.updatePlayer(player.id, { topSize: e.target.value })}>{DESIGNER_SIZES.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl><FormControl><InputLabel>Shorts</InputLabel><Select label="Shorts" value={player.shortsSize} onChange={e => s.updatePlayer(player.id, { shortsSize: e.target.value })}>{DESIGNER_SIZES.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl><TextField label="Qty" type="number" value={player.quantity} inputProps={{ min: 1, max: 99 }} onChange={e => s.updatePlayer(player.id, { quantity: Math.max(1, Math.min(99, Number(e.target.value))) })} /></Stack>
        </Box>)}</Stack>
        <Button fullWidth variant="outlined" startIcon={<AddRounded />} onClick={s.addPlayer} sx={{ mt: 1.5 }}>Add player</Button>
      </> : <>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={800}>Order review</Typography>
          <Typography variant="caption" fontWeight={800}>{errors.length ? `${errors.length} TO DO` : "READY"}</Typography>
        </Stack>
        <Box sx={{ borderBlock: "1px solid #dedede", my: 2 }}>
          {checks.map((check, index) => <Stack key={check.label} direction="row" alignItems="center" spacing={1.25} sx={{ py: 1.1, borderTop: index ? "1px solid #ededed" : 0 }}>
            {check.ready ? <CheckCircleRounded sx={{ fontSize: 18 }} /> : <RadioButtonUncheckedRounded color="disabled" sx={{ fontSize: 18 }} />}
            <Typography variant="body2" sx={{ flex: 1 }}>{check.label}</Typography>
            <Typography variant="caption" color="text.secondary">{check.ready ? "Ready" : "Missing"}</Typography>
          </Stack>)}
        </Box>
        <Stack spacing={.6}>
          <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Team</Typography><Typography variant="caption" fontWeight={800}>{s.teamName || "—"}</Typography></Stack>
          <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Uniform</Typography><Typography variant="caption" fontWeight={800} textTransform="capitalize">{s.sport} · {s.garmentType}</Typography></Stack>
          <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Quantity</Typography><Typography variant="caption" fontWeight={800}>{total}</Typography></Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">Colors</Typography>
            <Stack direction="row" spacing={.5}>{Object.values(s.colors).map(color => <Box key={color} title={color} sx={{ width: 14, height: 14, bgcolor: color, border: "1px solid #888", borderRadius: "50%" }} />)}</Stack>
          </Stack>
        </Stack>
        <Divider sx={{ my: 2.5 }} />
        <Typography fontWeight={800} mb={2}>Customer</Typography>
        <Stack spacing={1.25}><TextField label="Full name" value={s.customer.name} onChange={e => s.patch({ customer: { ...s.customer, name: e.target.value } })} /><TextField label="Email" type="email" value={s.customer.email} onChange={e => s.patch({ customer: { ...s.customer, email: e.target.value } })} /><TextField label="Phone" value={s.customer.phone} onChange={e => s.patch({ customer: { ...s.customer, phone: e.target.value } })} /><TextField label="Notes" multiline minRows={2} value={s.customer.notes} onChange={e => s.patch({ customer: { ...s.customer, notes: e.target.value } })} /></Stack>
        <Divider sx={{ my: 2.5 }} />
        <Typography fontWeight={800}>Production files</Typography>
        <Typography variant="caption" color="text.secondary">PNG and SVG export the visible side.</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 1.5 }}>
          <Button variant="outlined" startIcon={exporting === "png" ? <CircularProgress size={16} /> : <DownloadRounded />} disabled={Boolean(exporting)} onClick={() => runExport("png")}>PNG</Button>
          <Button variant="outlined" disabled={Boolean(exporting)} onClick={() => runExport("svg")}>SVG</Button>
          <Button variant="outlined" disabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back} onClick={() => runExport("pdf")}>{exporting === "pdf" ? <CircularProgress size={16} /> : "PDF"}</Button>
          <Button variant="contained" startIcon={exporting === "zip" ? <CircularProgress size={16} color="inherit" /> : <Inventory2Outlined />} disabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back} onClick={() => runExport("zip")}>ZIP</Button>
        </Box>
        <Typography variant="caption" color="text.secondary">ZIP includes both sides, PNG, SVG, PDF, and order data.</Typography>
        {errors.length > 0 && <Alert icon={false} severity="info" sx={{ mt: 2 }}>{errors[0]}</Alert>}
        <Button fullWidth variant="contained" startIcon={<LocalMallRounded />} disabled={errors.length > 0} onClick={checkout} sx={{ mt: 2 }}>Add to Shopify</Button>
      </>}
    </CardContent>
    {notice && <Snackbar open autoHideDuration={4000} onClose={() => setNotice(null)}><Alert severity={notice.severity}>{notice.text}</Alert></Snackbar>}
  </Card>;
}
