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
import { useDesignerStore } from "@/lib/designer/store";
import {
  downloadDesignerPng,
  downloadDesignerSvg,
  downloadProductionBundle,
  downloadProductionPdf,
  serializeDesignerSvg,
  type ProductionCaptures,
} from "@/lib/designer/export-service";
import { DESIGNER_SIZES, sendDesignerCheckout, validateCheckout } from "@/lib/designer/shopify-service";

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
      captures[view] = serializeDesignerSvg();
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
  const rosterReady = s.roster.length > 0 && s.roster.every((player) => player.name.trim() && player.number.trim() && player.quantity > 0);
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
    <section className="flex flex-col gap-2">
      {mode === "roster" ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted">{s.roster.length} players</span>
            <span className="text-[11px] font-extrabold">{total} pcs</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {s.roster.map((player, index) => (
              <div
                key={player.id}
                className="rounded-lg border border-border bg-surface p-1.5"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-extrabold">P{index + 1}</span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove player ${index + 1}`}
                    className="size-7 min-w-7"
                    onPress={() => s.removePlayer(player.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  <TextField
                    fullWidth
                    name={`name-${player.id}`}
                    value={player.name}
                    onChange={(value) => s.updatePlayer(player.id, { name: value.slice(0, 18) })}
                  >
                    <Label>Name</Label>
                    <Input maxLength={18} />
                  </TextField>
                  <TextField
                    name={`number-${player.id}`}
                    value={player.number}
                    className="max-w-[72px]"
                    onChange={(value) => s.updatePlayer(player.id, { number: value.replace(/\D/g, "").slice(0, 3) })}
                  >
                    <Label>#</Label>
                    <Input maxLength={3} />
                  </TextField>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <Select
                    fullWidth
                    selectedKey={player.topSize}
                    onSelectionChange={(key) => key && s.updatePlayer(player.id, { topSize: String(key) })}
                  >
                    <Label>Top</Label>
                    <Select.Trigger>
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
                    <Select.Trigger>
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
                    className="max-w-16"
                    onChange={(value) => s.updatePlayer(player.id, { quantity: Math.max(1, Math.min(99, Number(value) || 1)) })}
                  >
                    <Label>Qty</Label>
                    <Input min={1} max={99} />
                  </TextField>
                </div>
              </div>
            ))}
          </div>

          <Button fullWidth size="sm" variant="outline" className="min-h-8" onPress={s.addPlayer}>
            <Plus className="size-3" />
            Add player
          </Button>
        </>
      ) : focus === "export" ? (
        <>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Files</p>
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" variant="outline" className="min-h-8" isDisabled={Boolean(exporting)} onPress={() => runExport("png")}>
              {exporting === "png" ? <Spinner size="sm" /> : <Download className="size-3" />}
              PNG
            </Button>
            <Button size="sm" variant="outline" className="min-h-8" isDisabled={Boolean(exporting)} onPress={() => runExport("svg")}>
              SVG
            </Button>
            <Button size="sm" variant="outline" className="min-h-8" isDisabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back} onPress={() => runExport("pdf")}>
              {exporting === "pdf" ? <Spinner size="sm" /> : "PDF"}
            </Button>
            <Button size="sm" className="min-h-8" isDisabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back} onPress={() => runExport("zip")}>
              {exporting === "zip" ? <Spinner size="sm" color="current" /> : <Package className="size-3" />}
              ZIP
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert status="accent" className="py-1.5">
              <Alert.Content>
                <Alert.Title className="text-xs">{errors[0]}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          <Button fullWidth size="sm" className="min-h-8" isDisabled={errors.length > 0} onPress={checkout}>
            <ShoppingBag className="size-3.5" />
            Add to Shopify
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted">Checklist</span>
            <span className="text-[11px] font-extrabold">{errors.length ? `${errors.length} to do` : "Ready"}</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {checks.map((check, index) => (
              <div
                key={check.label}
                className={`flex items-center gap-1.5 px-2 py-1 ${index ? "border-t border-separator" : ""}`}
              >
                {check.ready
                  ? <CheckCircle2 className="size-3.5 text-success" />
                  : <Circle className="size-3.5 text-muted" />}
                <span className="flex-1 text-[11px] font-semibold">{check.label}</span>
                <span className="text-[11px] text-muted">{check.ready ? "Ready" : "—"}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="text-[11px] text-muted">Team</span>
              <span className="text-[11px] font-extrabold">{s.teamName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted">Uniform</span>
              <span className="text-[11px] font-extrabold capitalize">{s.sport} · {s.garmentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted">Qty</span>
              <span className="text-[11px] font-extrabold">{total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">Colors</span>
              <div className="flex gap-1">
                {Object.values(s.colors).map((color) => (
                  <span
                    key={color}
                    title={color}
                    className="size-2.5 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Separator />
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Customer</p>
          <div className="flex flex-col gap-1.5">
            <TextField fullWidth name="customer-name" value={s.customer.name} onChange={(value) => s.patch({ customer: { ...s.customer, name: value } })}>
              <Label>Full name</Label>
              <Input />
            </TextField>
            <TextField fullWidth name="customer-email" type="email" value={s.customer.email} onChange={(value) => s.patch({ customer: { ...s.customer, email: value } })}>
              <Label>Email</Label>
              <Input />
            </TextField>
            <TextField fullWidth name="customer-phone" value={s.customer.phone} onChange={(value) => s.patch({ customer: { ...s.customer, phone: value } })}>
              <Label>Phone</Label>
              <Input />
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
