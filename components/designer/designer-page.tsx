"use client";

import { useState, useSyncExternalStore } from "react";
import {
  AppBar, Box, Button, CssBaseline, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Drawer, IconButton, Stack, Tab, Tabs, ThemeProvider,
  Toolbar, Tooltip, Typography, useMediaQuery,
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import { useTheme } from "@mui/material/styles";
import { designerTheme } from "./designer-theme";
import { GarmentCanvas } from "./garment-canvas";
import { PromptPanel } from "./prompt-panel";
import { ArtworkControls } from "./artwork-controls";
import { OrderPanel } from "./order-panel";
import { useDesignerStore } from "@/lib/designer/store";
import { validateCheckout } from "@/lib/designer/shopify-service";

type MainTab = "design" | "order";
type DesignTab = "brief" | "placement";
type OrderTab = "roster" | "review";
const sidebarWidth = 380;

function SidebarContent({ close }: { close?: () => void }) {
  const s = useDesignerStore();
  const [mainTab, setMainTab] = useState<MainTab>("design");
  const [designTab, setDesignTab] = useState<DesignTab>("brief");
  const [orderTab, setOrderTab] = useState<OrderTab>("roster");
  const [resetOpen, setResetOpen] = useState(false);
  const reviewErrors = validateCheckout(s);

  return <Stack sx={{ height: "100%", bgcolor: "#fff" }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, height: 64 }}>
      <Box><Typography fontWeight={900} letterSpacing=".04em">BESU</Typography><Typography variant="caption" color="text.secondary">Uniform designer</Typography></Box>
      <Stack direction="row">
        <Tooltip title="Start new design"><IconButton aria-label="Start new design" onClick={() => setResetOpen(true)}><RestartAltRounded /></IconButton></Tooltip>
        {close && <IconButton aria-label="Close controls" onClick={close}><CloseRounded /></IconButton>}
      </Stack>
    </Stack>
    <Divider />
    <Tabs value={mainTab} onChange={(_, value: MainTab) => setMainTab(value)} variant="fullWidth" sx={{ minHeight: 48, "& .MuiTab-root": { minHeight: 48 } }}>
      <Tab value="design" label="Design" /><Tab value="order" label="Order" />
    </Tabs>
    <Divider />
    {mainTab === "design" ? <>
      <Tabs value={designTab} onChange={(_, value: DesignTab) => setDesignTab(value)} variant="fullWidth" sx={{ bgcolor: "#f7f7f7", minHeight: 42, "& .MuiTab-root": { minHeight: 42, fontSize: 12 } }}>
        <Tab value="brief" label="Brief" /><Tab value="placement" label="Placement" />
      </Tabs>
      <Box sx={{ overflowY: "auto", flex: 1 }}>{designTab === "brief" ? <PromptPanel /> : <ArtworkControls />}</Box>
    </> : <>
      <Tabs value={orderTab} onChange={(_, value: OrderTab) => setOrderTab(value)} variant="fullWidth" sx={{ bgcolor: "#f7f7f7", minHeight: 42, "& .MuiTab-root": { minHeight: 42, fontSize: 12 } }}>
        <Tab value="roster" label="Roster" /><Tab value="review" label="Review" />
      </Tabs>
      <Box sx={{ overflowY: "auto", flex: 1 }}><OrderPanel mode={orderTab} /></Box>
    </>}
    <Divider />
    <Stack sx={{ p: 1.5 }} spacing={.75}>
      <Button fullWidth variant="contained" onClick={() => { setMainTab("order"); setOrderTab("review"); }}>Review order</Button>
      {reviewErrors.length > 0 && <Typography variant="caption" color="text.secondary" textAlign="center">{reviewErrors[0]}</Typography>}
    </Stack>
    <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
      <DialogTitle>Start a new design?</DialogTitle>
      <DialogContent><Typography variant="body2" color="text.secondary">This clears the current artwork, roster, and customer details.</Typography></DialogContent>
      <DialogActions>
        <Button onClick={() => setResetOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => { s.reset(); setMainTab("design"); setDesignTab("brief"); setResetOpen(false); }}>Clear design</Button>
      </DialogActions>
    </Dialog>
  </Stack>;
}

function ResponsiveShell() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  return <Box component="main" sx={{ height: "100dvh", bgcolor: "#fff", overflow: "hidden" }}>
    {mobile && <AppBar position="static" elevation={0} sx={{ bgcolor: "#000", height: 56 }}><Toolbar variant="dense" sx={{ minHeight: 56 }}><IconButton color="inherit" edge="start" aria-label="Open controls" onClick={() => setDrawerOpen(true)}><MenuRounded /></IconButton><Typography fontWeight={900} sx={{ ml: 1, flex: 1 }}>BESU</Typography><Typography variant="caption">Designer</Typography></Toolbar></AppBar>}

    {mobile ? <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: "min(92vw, 390px)" } }}><SidebarContent close={() => setDrawerOpen(false)} /></Drawer> : <Box component="aside" sx={{ position: "fixed", inset: "0 auto 0 0", width: sidebarWidth, borderRight: "1px solid #dedede", zIndex: 2 }}><SidebarContent /></Box>}

    <Box sx={{ ml: { xs: 0, md: `${sidebarWidth}px` }, height: { xs: "calc(100dvh - 56px)", md: "100dvh" }, p: { xs: 1, sm: 2, md: 3 }, bgcolor: "#fff" }}>
      <Box sx={{ height: "100%", maxWidth: 1080, mx: "auto" }}><GarmentCanvas /></Box>
      {mobile && <Tooltip title="Design controls"><Button variant="contained" startIcon={<MenuRounded />} onClick={() => setDrawerOpen(true)} sx={{ position: "fixed", left: 16, bottom: 16, borderRadius: 99, px: 2.5 }}>Controls</Button></Tooltip>}
    </Box>
  </Box>;
}

export function DesignerPage() {
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  return <ThemeProvider theme={designerTheme}><CssBaseline />{mounted ? <ResponsiveShell /> : <Box sx={{ height: "100dvh", bgcolor: "#fff" }} />}</ThemeProvider>;
}
