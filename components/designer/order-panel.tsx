"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import {
  CheckCircle2,
  Circle,
  Download,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getPreviewPlayer, useDesignerStore } from "@/lib/designer/store";
import {
  downloadDesignerPng,
  downloadDesignerSvg,
  downloadProductionBundle,
  downloadProductionPdf,
  serializeDesignerSvg,
  type ProductionCaptures,
} from "@/lib/designer/export-service";
import { DESIGNER_SIZES, sendDesignerCheckout, validateCheckout, validateRoster } from "@/lib/designer/shopify-service";

function waitForPreview() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function captureProductionViews() {
  const store = useDesignerStore.getState();
  const originalView = store.view;
  const captures = {} as ProductionCaptures;
  try {
    for (const view of ["front", "back"] as const) {
      useDesignerStore.getState().setView(view);
      await waitForPreview();
      captures[view] = await serializeDesignerSvg({ embedImages: true });
    }
  } finally {
    useDesignerStore.getState().setView(originalView);
    await waitForPreview();
  }
  return captures;
}

export function OrderPanel({
  mode = "roster",
  focus = "review",
}: {
  mode?: "roster" | "review";
  focus?: "review" | "export";
}) {
  const s = useDesignerStore();
  const [exporting, setExporting] = useState<"png" | "svg" | "pdf" | "zip" | null>(null);
  const total = s.roster.reduce((sum, player) => sum + player.quantity, 0);
  const errors = useMemo(() => validateCheckout(s), [s]);
  const rosterErrors = useMemo(() => validateRoster(s), [s]);
  const rosterReady = rosterErrors.length === 0;
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
      const snapshot = useDesignerStore.getState();
      const captures = await captureProductionViews();
      if (kind === "png") await downloadDesignerPng(snapshot, captures);
      else if (kind === "svg") await downloadDesignerSvg(snapshot, captures);
      else if (kind === "pdf") await downloadProductionPdf(snapshot, captures);
      else await downloadProductionBundle(snapshot, captures);
      toast.success(`${kind.toUpperCase()} ready.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(null);
    }
  }

  function checkout() {
    const result = sendDesignerCheckout(s);
    if (result.ok) toast.success("Sent to Shopify.");
    else toast.error(result.errors[0]);
  }

  return (
    <section className="flex flex-col gap-3">
      {mode === "roster" ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">
              {s.roster.length} {s.roster.length === 1 ? "player" : "players"}
            </span>
            <span className="text-[12px] font-semibold tabular-nums">{total} pcs</span>
          </div>

          {s.roster.length > 0 ? (
            <div className="rounded-xl bg-[#f7f7f5] px-3 py-2.5 ring-1 ring-border/55">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Back preview player
              </p>
              <p className="m-0 mt-0.5 text-[11px] text-muted">
                Name and number on the back update from the selected player.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.roster.map((player) => {
                  const selected = (s.previewPlayerId || s.roster[0]?.id) === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        s.setPreviewPlayer(player.id);
                        s.setView("back");
                      }}
                      className={`min-h-10 rounded-full px-3 text-[11px] font-semibold ring-1 ${
                        selected
                          ? "bg-foreground text-white ring-foreground"
                          : "bg-white text-foreground ring-border/70"
                      }`}
                    >
                      {(player.name || "Player").slice(0, 12)}
                      {player.number ? ` #${player.number}` : ""}
                    </button>
                  );
                })}
              </div>
              {getPreviewPlayer(s) ? (
                <p className="m-0 mt-2 text-[11px] text-muted">
                  Showing back for{" "}
                  <span className="font-semibold text-foreground">
                    {getPreviewPlayer(s)?.name || "Unnamed"} #{getPreviewPlayer(s)?.number || "—"}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          {s.roster.length === 0 ? (
            <div className="rounded-xl bg-[#f7f7f5] px-3 py-4 text-center ring-1 ring-border/60">
              <p className="m-0 text-[12px] font-semibold text-foreground">No players yet</p>
              <p className="m-0 mt-1 text-[11px] leading-snug text-muted">
                Add names, numbers, and sizes for each uniform.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {s.roster.map((player, index) => (
              <div
                key={player.id}
                className="rounded-xl border border-border/80 bg-white p-2.5 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold">Player {index + 1}</span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove player ${index + 1}`}
                    className="size-10 min-w-10 text-muted"
                    onPress={() => s.removePlayer(player.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <TextField
                    fullWidth
                    name={`name-${player.id}`}
                    value={player.name}
                    onChange={(value) => s.updatePlayer(player.id, { name: value.slice(0, 18) })}
                  >
                    <Label>Name</Label>
                    <Input maxLength={18} className="min-h-11" />
                  </TextField>
                  <TextField
                    name={`number-${player.id}`}
                    value={player.number}
                    className="max-w-[84px]"
                    onChange={(value) => s.updatePlayer(player.id, { number: value.replace(/\D/g, "").slice(0, 3) })}
                  >
                    <Label>#</Label>
                    <Input maxLength={3} className="min-h-11" />
                  </TextField>
                </div>
                <div className="mt-2 grid grid-cols-[1fr_1fr_72px] gap-2">
                  <Select
                    fullWidth
                    selectedKey={player.topSize}
                    onSelectionChange={(key) => key && s.updatePlayer(player.id, { topSize: String(key) })}
                  >
                    <Label>Top</Label>
                    <Select.Trigger className="min-h-11">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {DESIGNER_SIZES.map((size) => (
                          <ListBox.Item key={size} id={size} textValue={size}>
                            {size}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <Select
                    fullWidth
                    selectedKey={player.shortsSize}
                    onSelectionChange={(key) => key && s.updatePlayer(player.id, { shortsSize: String(key) })}
                  >
                    <Label>Shorts</Label>
                    <Select.Trigger className="min-h-11">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {DESIGNER_SIZES.map((size) => (
                          <ListBox.Item key={size} id={size} textValue={size}>
                            {size}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <TextField
                    name={`qty-${player.id}`}
                    type="number"
                    value={String(player.quantity)}
                    onChange={(value) => s.updatePlayer(player.id, { quantity: Math.max(1, Math.min(99, Number(value) || 1)) })}
                  >
                    <Label>Qty</Label>
                    <Input min={1} max={99} className="min-h-11" />
                  </TextField>
                </div>
              </div>
            ))}
          </div>

          <Button fullWidth size="sm" variant="outline" className="min-h-11" onPress={s.addPlayer}>
            <Plus className="size-4" />
            Add player
          </Button>

          {rosterErrors.length > 0 && (
            <Alert status="accent" className="py-2">
              <Alert.Content>
                <Alert.Title className="text-xs">{rosterErrors[0]}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}
        </>
      ) : focus === "export" ? (
        <>
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Production files
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="min-h-11"
              isDisabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back}
              onPress={() => runExport("png")}
            >
              {exporting === "png" ? <Spinner size="sm" /> : <Download className="size-3.5" />}
              PNGs
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-11"
              isDisabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back}
              onPress={() => runExport("svg")}
            >
              SVGs
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-11"
              isDisabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back}
              onPress={() => runExport("pdf")}
            >
              {exporting === "pdf" ? <Spinner size="sm" /> : "PDF"}
            </Button>
            <Button
              size="sm"
              className="min-h-11"
              isDisabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back}
              onPress={() => runExport("zip")}
            >
              {exporting === "zip" ? <Spinner size="sm" color="current" /> : <Package className="size-3.5" />}
              ZIP
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert status="accent" className="py-2">
              <Alert.Content>
                <Alert.Title className="text-xs">{errors[0]}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          <Button
            fullWidth
            size="sm"
            className="min-h-11 font-semibold"
            isDisabled={errors.length > 0}
            onPress={checkout}
          >
            <ShoppingBag className="size-4" />
            Add to Shopify
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Checklist</span>
            <span className="text-[12px] font-semibold">
              {errors.length ? `${errors.length} to do` : "Ready"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/80 bg-white">
            {checks.map((check, index) => (
              <div
                key={check.label}
                className={`flex min-h-11 items-center gap-2 px-3 py-2 ${index ? "border-t border-separator" : ""}`}
              >
                {check.ready
                  ? <CheckCircle2 className="size-4 shrink-0 text-success" />
                  : <Circle className="size-4 shrink-0 text-muted" />}
                <span className="flex-1 text-[12px] font-semibold">{check.label}</span>
                <span className="text-[11px] text-muted">{check.ready ? "Ready" : "Needed"}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl bg-[#f7f7f5] px-3 py-2.5 ring-1 ring-border/50">
            <div className="flex justify-between gap-3">
              <span className="text-[12px] text-muted">Team</span>
              <span className="truncate text-[12px] font-semibold">{s.teamName || "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[12px] text-muted">Uniform</span>
              <span className="text-[12px] font-semibold capitalize">{s.sport} · {s.garmentType}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[12px] text-muted">Qty</span>
              <span className="text-[12px] font-semibold tabular-nums">{total}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">Colors</span>
              <div className="flex gap-1.5">
                {Object.entries(s.colors).map(([role, color]) => (
                  <span
                    key={role}
                    title={`${role}: ${color}`}
                    className="size-3.5 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Separator />
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Customer
          </p>
          <div className="flex flex-col gap-2">
            <TextField fullWidth name="customer-name" value={s.customer.name} onChange={(value) => s.patch({ customer: { ...s.customer, name: value } })}>
              <Label>Full name</Label>
              <Input className="min-h-11" />
            </TextField>
            <TextField fullWidth name="customer-email" type="email" value={s.customer.email} onChange={(value) => s.patch({ customer: { ...s.customer, email: value } })}>
              <Label>Email</Label>
              <Input className="min-h-11" />
            </TextField>
            <TextField fullWidth name="customer-phone" value={s.customer.phone} onChange={(value) => s.patch({ customer: { ...s.customer, phone: value } })}>
              <Label>Phone</Label>
              <Input className="min-h-11" inputMode="tel" />
            </TextField>
            <TextField fullWidth name="customer-notes" value={s.customer.notes} onChange={(value) => s.patch({ customer: { ...s.customer, notes: value } })}>
              <Label>Notes</Label>
              <TextArea rows={2} />
            </TextField>
          </div>
        </>
      )}
    </section>
  );
}
