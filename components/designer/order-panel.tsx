"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
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

  async function runExport(kind: "png" | "svg" | "pdf" | "zip") {
    if (exporting) return;
    setExporting(kind);
    try {
      const snapshot = useDesignerStore.getState();
      if (!snapshot.artwork.front || !snapshot.artwork.back) throw new Error("Complete the design first.");
      const captures = await captureProductionViews();
      if (kind === "png") await downloadDesignerPng(snapshot, captures);
      else if (kind === "svg") await downloadDesignerSvg(snapshot, captures);
      else if (kind === "pdf") await downloadProductionPdf(snapshot, captures);
      else await downloadProductionBundle(snapshot, captures);
      toast.success(`${kind.toUpperCase()} ready.`);
    } catch (exportError) {
      toast.error(exportError instanceof Error ? exportError.message : "Export failed.");
    } finally {
      setExporting(null);
    }
  }

  function checkout() {
    const result = sendDesignerCheckout(useDesignerStore.getState());
    if (result.ok) toast.success("Sent to Shopify.");
    else toast.error(result.errors[0] || "Checkout failed.");
  }

  return (
    <section className="flex min-w-0 flex-col gap-3">
      {mode === "roster" ? (
        <>
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>{s.roster.length} players</span>
            <span className="font-semibold tabular-nums text-foreground">{total} pcs</span>
          </div>

          {s.roster.length > 1 ? (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    className={`min-h-8 shrink-0 rounded-full px-2.5 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 ${selected ? "bg-[#181816] text-white" : "bg-black/[0.035] text-foreground"}`}
                  >
                    {(player.name || `Player ${s.roster.indexOf(player) + 1}`).slice(0, 12)}{player.number ? ` #${player.number}` : ""}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-2">
            {s.roster.map((player, index) => (
              <div key={player.id} className="min-w-0 rounded-xl bg-black/[0.025] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => s.removePlayer(player.id)}
                    className="min-h-8 rounded-md px-1.5 text-[10px] font-medium text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_76px] gap-2">
                  <TextField fullWidth className="min-w-0" name={`name-${player.id}`} value={player.name} onChange={(value) => s.updatePlayer(player.id, { name: value.slice(0, 18) })}>
                    <Label>Name</Label>
                    <Input maxLength={18} className="min-h-11" />
                  </TextField>
                  <TextField fullWidth className="min-w-0" name={`number-${player.id}`} value={player.number} onChange={(value) => s.updatePlayer(player.id, { number: value.replace(/\D/g, "").slice(0, 3) })}>
                    <Label>#</Label>
                    <Input maxLength={3} inputMode="numeric" className="min-h-11" />
                  </TextField>
                </div>

                <div className="mt-2 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_72px]">
                  <Select fullWidth className="min-w-0" selectedKey={player.topSize} onSelectionChange={(key) => key && s.updatePlayer(player.id, { topSize: String(key) })}>
                    <Label>Top</Label>
                    <Select.Trigger className="min-h-11 min-w-0"><Select.Value /><Select.Indicator /></Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {DESIGNER_SIZES.map((size) => (
                          <ListBox.Item key={size} id={size} textValue={size}>{size}<ListBox.ItemIndicator /></ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <Select fullWidth className="min-w-0" selectedKey={player.shortsSize} onSelectionChange={(key) => key && s.updatePlayer(player.id, { shortsSize: String(key) })}>
                    <Label>Shorts</Label>
                    <Select.Trigger className="min-h-11 min-w-0"><Select.Value /><Select.Indicator /></Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {DESIGNER_SIZES.map((size) => (
                          <ListBox.Item key={size} id={size} textValue={size}>{size}<ListBox.ItemIndicator /></ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <TextField fullWidth className="col-span-2 min-w-0 sm:col-span-1" name={`qty-${player.id}`} type="number" value={String(player.quantity)} onChange={(value) => s.updatePlayer(player.id, { quantity: Math.max(1, Math.min(99, Number(value) || 1)) })}>
                    <Label>Qty</Label>
                    <Input min={1} max={99} inputMode="numeric" className="min-h-11" />
                  </TextField>
                </div>
              </div>
            ))}
          </div>

          <Button fullWidth size="sm" variant="ghost" className="min-h-10 rounded-xl bg-black/[0.025]" onPress={s.addPlayer}>
            Add player
          </Button>

          {rosterErrors.length > 0 ? <p role="alert" className="m-0 text-[11px] font-medium text-muted">{rosterErrors[0]}</p> : null}
        </>
      ) : focus === "export" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(["png", "svg", "pdf", "zip"] as const).map((kind) => (
              <Button
                key={kind}
                size="sm"
                variant={kind === "zip" ? "primary" : "outline"}
                className="min-h-11 rounded-xl uppercase"
                isDisabled={Boolean(exporting) || !s.artwork.front || !s.artwork.back}
                onPress={() => void runExport(kind)}
              >
                {exporting === kind ? <Spinner size="sm" color={kind === "zip" ? "current" : undefined} /> : null}
                {kind}
              </Button>
            ))}
          </div>

          {errors.length > 0 ? <p role="alert" className="m-0 text-[11px] font-medium text-muted">{errors[0]}</p> : null}

          <Button fullWidth size="sm" className="min-h-12 rounded-xl font-semibold" isDisabled={errors.length > 0} onPress={checkout}>
            Add to Shopify
          </Button>
        </>
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-1.5 rounded-xl bg-black/[0.025] px-3 py-2.5">
            <div className="flex justify-between gap-3 text-[11px]"><span className="text-muted">Team</span><span className="truncate font-semibold">{s.teamName || "—"}</span></div>
            <div className="flex justify-between gap-3 text-[11px]"><span className="text-muted">Qty</span><span className="font-semibold tabular-nums">{total}</span></div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted">Colors</span>
              <div className="flex -space-x-0.5">
                {Object.entries(s.colors).map(([role, color]) => (
                  <span key={role} title={`${role}: ${color}`} className="size-3.5 rounded-full ring-1 ring-white" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>

          {errors.length > 0 ? <p role="alert" className="m-0 text-[11px] font-medium text-muted">{errors[0]}</p> : null}

          <div className="flex min-w-0 flex-col gap-2 pt-1">
            <TextField fullWidth className="min-w-0" name="customer-name" value={s.customer.name} onChange={(value) => s.patch({ customer: { ...s.customer, name: value } })}>
              <Label>Name</Label><Input className="min-h-11" autoComplete="name" />
            </TextField>
            <TextField fullWidth className="min-w-0" name="customer-email" type="email" value={s.customer.email} onChange={(value) => s.patch({ customer: { ...s.customer, email: value } })}>
              <Label>Email</Label><Input className="min-h-11" autoComplete="email" inputMode="email" />
            </TextField>
            <TextField fullWidth className="min-w-0" name="customer-phone" value={s.customer.phone} onChange={(value) => s.patch({ customer: { ...s.customer, phone: value } })}>
              <Label>Phone</Label><Input className="min-h-11" inputMode="tel" autoComplete="tel" />
            </TextField>
            <TextField fullWidth className="min-w-0" name="customer-notes" value={s.customer.notes} onChange={(value) => s.patch({ customer: { ...s.customer, notes: value } })}>
              <Label>Notes</Label><TextArea rows={2} className="min-h-[76px]" />
            </TextField>
          </div>
        </>
      )}
    </section>
  );
}
