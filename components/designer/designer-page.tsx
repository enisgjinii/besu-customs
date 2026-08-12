"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Modal,
  Surface,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  FlipHorizontal2,
  RotateCcw,
  Shirt,
} from "lucide-react";
import { GarmentCanvas } from "./garment-canvas";
import { PromptPanel } from "./prompt-panel";
import { ArtworkControls } from "./artwork-controls";
import { OrderPanel } from "./order-panel";
import { ColorControl } from "./color-control";
import {
  COLOR_ROLE_OPTIONS,
  DESIGNER_STEPS,
  FONT_OPTIONS,
  GARMENT_OPTIONS,
  ORDER_FOCUS_OPTIONS,
  PLACE_LAYER_OPTIONS,
  STEP_INDEX,
  type DesignerStepId,
  type StepOption,
} from "./designer-steps";
import { useDesignerStore } from "@/lib/designer/store";
import type { GarmentType } from "@/lib/designer/types";
import { cn } from "@/lib/utils";

type ColorRole = "primary" | "secondary" | "accent";
type PlaceLayer = "artwork" | "text";
type OrderFocus = "review" | "export";

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: StepOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
        selected
          ? "bg-default ring-1 ring-foreground/15"
          : "bg-default/60 hover:bg-default",
      )}
    >
      {option.swatch ? (
        <span
          className="size-7 shrink-0 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: option.swatch }}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            "size-7 shrink-0 rounded-full border border-border",
            selected ? "bg-foreground/10" : "bg-background",
          )}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">
          {option.label}
        </span>
        {option.sublabel ? (
          <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted">
            {option.sublabel}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function ColorsDetail({ role }: { role: ColorRole }) {
  const s = useDesignerStore();
  return (
    <div className="flex flex-col gap-2">
      <ColorControl
        label={role}
        value={s.colors[role]}
        onChange={(value) => s.patch({ colors: { ...s.colors, [role]: value } })}
      />
      <p className="text-[11px] leading-snug text-muted">
        Tap the swatch to set hex or pick a palette color.
      </p>
    </div>
  );
}

function TextDetail() {
  const s = useDesignerStore();
  return (
    <TextField
      fullWidth
      name="team"
      value={s.teamName}
      onChange={(value) => s.patch({ teamName: value.toUpperCase().slice(0, 60) })}
    >
      <Label>Team name</Label>
      <Input placeholder="BESU ELITE" maxLength={60} />
    </TextField>
  );
}

function StepDetail({
  step,
  colorRole,
  placeLayer,
  orderFocus,
}: {
  step: DesignerStepId;
  colorRole: ColorRole;
  placeLayer: PlaceLayer;
  orderFocus: OrderFocus;
}) {
  if (step === "design") return <PromptPanel />;
  if (step === "colors") return <ColorsDetail role={colorRole} />;
  if (step === "text") return <TextDetail />;
  if (step === "place") return <ArtworkControls forcedLayer={placeLayer} />;
  if (step === "roster") return <OrderPanel mode="roster" />;
  return <OrderPanel mode="review" focus={orderFocus} />;
}

export function DesignerPage() {
  const [step, setStep] = useState<DesignerStepId>("design");
  const [colorRole, setColorRole] = useState<ColorRole>("primary");
  const [placeLayer, setPlaceLayer] = useState<PlaceLayer>("artwork");
  const [orderFocus, setOrderFocus] = useState<OrderFocus>("review");
  const [detailOpen, setDetailOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const store = useDesignerStore();
  const rosterCount = store.roster.length;
  const reset = store.reset;
  const stepIndex = STEP_INDEX[step];
  const stepDef = DESIGNER_STEPS[stepIndex];

  const colorOptions: StepOption[] = COLOR_ROLE_OPTIONS.map((option) => ({
    ...option,
    swatch: store.colors[option.id as ColorRole],
    sublabel: store.colors[option.id as ColorRole],
  }));

  let options: StepOption[] = GARMENT_OPTIONS;
  let activeOptionId: string = store.garmentType;
  let onSelectOption: (id: string) => void = (id) => {
    store.setGarment(id as GarmentType);
    setDetailOpen(true);
  };

  if (step === "colors") {
    options = colorOptions;
    activeOptionId = colorRole;
    onSelectOption = (id) => {
      setColorRole(id as ColorRole);
      setDetailOpen(true);
    };
  } else if (step === "text") {
    options = FONT_OPTIONS;
    activeOptionId = store.font;
    onSelectOption = (id) => {
      store.patch({ font: id });
      setDetailOpen(true);
    };
  } else if (step === "place") {
    options = PLACE_LAYER_OPTIONS;
    activeOptionId = placeLayer;
    onSelectOption = (id) => {
      setPlaceLayer(id as PlaceLayer);
      setDetailOpen(true);
    };
  } else if (step === "roster") {
    options = [
      {
        id: "players",
        label: rosterCount ? `${rosterCount} players` : "Players",
        sublabel: rosterCount ? "Edit roster" : "Empty",
      },
      { id: "add", label: "Add player", sublabel: "New row" },
    ];
    activeOptionId = "players";
    onSelectOption = (id) => {
      if (id === "add") store.addPlayer();
      setDetailOpen(true);
    };
  } else if (step === "order") {
    options = ORDER_FOCUS_OPTIONS;
    activeOptionId = orderFocus;
    onSelectOption = (id) => {
      setOrderFocus(id as OrderFocus);
      setDetailOpen(true);
    };
  }

  const canGoBack = stepIndex > 0;
  const nextStep = DESIGNER_STEPS[stepIndex + 1] ?? null;
  const prevStep = canGoBack ? DESIGNER_STEPS[stepIndex - 1] : null;
  const showDetail = stepDef.expandsDetail && detailOpen;

  function goBack() {
    if (!canGoBack) return;
    setDetailOpen(false);
    setStep(DESIGNER_STEPS[stepIndex - 1].id);
  }

  function goNext() {
    if (!nextStep) {
      setOrderFocus("export");
      setDetailOpen(true);
      return;
    }
    setDetailOpen(false);
    setStep(nextStep.id);
  }

  return (
    <main
      data-designer-shell="v5-configurator-dock"
      className="flex h-dvh w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f7f2ea_0%,#f3ebe1_48%,#efe6da_100%)]"
    >
      {/* Immersive product viewport */}
      <div className="relative min-h-0 flex-1">
        <GarmentCanvas />

        {/* Front / Back — floating near canvas top */}
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
          style={{ top: "max(12px, env(safe-area-inset-top, 0px))" }}
        >
          <ToggleButtonGroup
            size="sm"
            selectionMode="single"
            isDetached
            disallowEmptySelection
            selectedKeys={new Set([store.view])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next === "front" || next === "back") store.setView(next);
            }}
            className="pointer-events-auto gap-0.5 rounded-full bg-background/80 p-0.5 shadow-sm ring-1 ring-border/60 backdrop-blur-sm"
            aria-label="Garment view"
          >
            <ToggleButton
              id="front"
              className="min-h-8 gap-1 rounded-full px-3 text-[11px] font-semibold"
            >
              <Shirt className="size-3.5" strokeWidth={1.75} aria-hidden />
              Front
            </ToggleButton>
            <ToggleButton
              id="back"
              className="min-h-8 gap-1 rounded-full px-3 text-[11px] font-semibold"
            >
              <FlipHorizontal2 className="size-3.5" strokeWidth={1.75} aria-hidden />
              Back
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        {/* Reset — discreet, top-right */}
        <div
          className="absolute z-20"
          style={{
            top: "max(12px, env(safe-area-inset-top, 0px))",
            right: "max(12px, env(safe-area-inset-right, 0px))",
          }}
        >
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Reset design"
            className="size-8 rounded-full bg-background/70 text-muted shadow-sm ring-1 ring-border/50 backdrop-blur-sm"
            onPress={() => setResetOpen(true)}
          >
            <RotateCcw className="size-3.5" strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      </div>

      {/* Compact centered bottom control dock */}
      <Surface
        variant="default"
        className="relative z-30 shrink-0 rounded-none border-0 border-t border-separator bg-background pb-[max(10px,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.04)]"
      >
        <div className="mx-auto w-full max-w-[420px] px-3 sm:max-w-[480px] sm:px-4">
          <header className="mb-2.5 text-center">
            <h2 className="m-0 font-serif text-[1.05rem] font-medium tracking-tight text-foreground sm:text-[1.15rem]">
              {stepDef.header}
            </h2>
          </header>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={prevStep ? `Back to ${prevStep.label}` : "Previous step"}
              isDisabled={!canGoBack}
              className={cn(
                "size-9 shrink-0 rounded-full",
                !canGoBack && "invisible",
              )}
              onPress={goBack}
            >
              <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden />
            </Button>

            <ul
              className="m-0 grid min-w-0 flex-1 list-none grid-cols-2 gap-1.5 p-0"
              role="listbox"
              aria-label={stepDef.chooseTitle}
            >
              {options.map((option) => (
                <li key={option.id} className="min-w-0">
                  <OptionCard
                    option={option}
                    selected={option.id === activeOptionId}
                    onSelect={() => onSelectOption(option.id)}
                  />
                </li>
              ))}
            </ul>

            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={nextStep ? `Next: ${nextStep.label}` : "Export"}
              className="size-9 shrink-0 rounded-full"
              onPress={goNext}
            >
              <ChevronRight className="size-5" strokeWidth={1.75} aria-hidden />
            </Button>
          </div>

          {showDetail ? (
            <Card
              variant="secondary"
              className="mt-2.5 max-h-[min(32vh,280px)] overflow-hidden rounded-2xl border-0 shadow-none"
            >
              <Card.Content className="max-h-[min(32vh,280px)] overflow-y-auto overscroll-contain p-3">
                <StepDetail
                  step={step}
                  colorRole={colorRole}
                  placeLayer={placeLayer}
                  orderFocus={orderFocus}
                />
              </Card.Content>
            </Card>
          ) : stepDef.expandsDetail ? (
            <p className="mt-2 pb-0.5 text-center text-[11px] text-muted">
              Select an option to open controls
            </p>
          ) : null}
        </div>
      </Surface>

      <Modal>
        <Modal.Backdrop isOpen={resetOpen} onOpenChange={setResetOpen}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[340px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="font-extrabold">Start a new design?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted">
                  Clears artwork, roster, and customer details.
                </p>
              </Modal.Body>
              <Modal.Footer className="gap-2">
                <Button variant="outline" slot="close">
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    reset();
                    setStep("design");
                    setColorRole("primary");
                    setPlaceLayer("artwork");
                    setOrderFocus("review");
                    setDetailOpen(false);
                    setResetOpen(false);
                  }}
                >
                  Clear design
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </main>
  );
}
