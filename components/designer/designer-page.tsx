"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Modal,
  Surface,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { GarmentCanvas } from "./garment-canvas";
import { ProductPanel } from "./product-panel";
import { PromptPanel } from "./prompt-panel";
import { RefinePanel } from "./refine-panel";
import { OrderPanel } from "./order-panel";
import {
  DESIGNER_STEPS,
  STEP_INDEX,
  type DesignerStepId,
} from "./designer-steps";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignerStep } from "@/lib/designer/types";
import { cn } from "@/lib/utils";

type OrderFocus = "review" | "export";

function StepDetail({
  step,
  orderFocus,
}: {
  step: DesignerStepId;
  orderFocus: OrderFocus;
}) {
  if (step === "product") return <ProductPanel />;
  if (step === "design") return <PromptPanel />;
  if (step === "refine") return <RefinePanel />;
  if (step === "roster") return <OrderPanel mode="roster" />;
  return <OrderPanel mode="review" focus={orderFocus} />;
}

function stepIdFromIndex(index: DesignerStep): DesignerStepId {
  return DESIGNER_STEPS[index]?.id ?? "product";
}

export function DesignerPage() {
  const [orderFocus, setOrderFocus] = useState<OrderFocus>("review");
  const [resetOpen, setResetOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const panelScrollRef = useRef<HTMLDivElement>(null);

  const store = useDesignerStore();
  const reset = store.reset;
  const stepIndex = store.activeStep;
  const step = stepIdFromIndex(stepIndex);
  const stepDef = DESIGNER_STEPS[stepIndex];

  function goToStep(next: DesignerStepId) {
    store.setStep(STEP_INDEX[next] as DesignerStep);
    panelScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setSheetExpanded(false);
    if (next === "order") setOrderFocus("review");
  }

  function goNext() {
    const next = stepDef.nextLabel
      ? DESIGNER_STEPS[stepIndex + 1]?.id
      : null;
    if (next) goToStep(next);
  }

  function goBack() {
    if (stepIndex <= 0) return;
    goToStep(DESIGNER_STEPS[stepIndex - 1].id);
  }

  // Keep the shell height aligned with the visual viewport (iOS keyboard).
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--designer-vvh", `${Math.round(height)}px`);
    };
    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      root.style.removeProperty("--designer-vvh");
    };
  }, []);

  return (
    <main
      data-designer-shell="v9-ai-first"
      className="designer-shell flex h-[var(--designer-vvh,100dvh)] w-full overflow-hidden bg-[#f7f7f5] max-md:flex-col md:bg-white"
    >
      <Surface
        variant="default"
        className={cn(
          "relative z-30 flex shrink-0 overflow-hidden rounded-none border-0 bg-white",
          "md:h-full md:w-1/4 md:min-w-[320px] md:max-w-[430px] md:border-r md:border-separator md:px-3",
          "md:pb-[max(12px,env(safe-area-inset-bottom,0px))] md:pt-[max(12px,env(safe-area-inset-top,0px))]",
          "md:shadow-[8px_0_24px_rgba(15,23,42,0.03)]",
          "max-md:order-2 max-md:w-full max-md:max-w-none max-md:min-w-0 max-md:flex-col",
          "max-md:rounded-t-[22px] max-md:border-t max-md:border-separator",
          "max-md:shadow-[0_-12px_40px_rgba(15,23,42,0.08)]",
          "max-md:pb-[max(8px,env(safe-area-inset-bottom,0px))]",
          "max-md:transition-[height] max-md:duration-200 max-md:ease-out",
          sheetExpanded
            ? "max-md:h-[min(78dvh,640px)]"
            : "max-md:h-[min(46dvh,420px)]",
        )}
      >
        <button
          type="button"
          className="flex w-full shrink-0 flex-col items-center gap-2 px-3 pb-1 pt-2 md:hidden"
          aria-expanded={sheetExpanded}
          aria-label={sheetExpanded ? "Collapse controls" : "Expand controls"}
          onClick={() => setSheetExpanded((open) => !open)}
        >
          <span className="h-1 w-10 rounded-full bg-foreground/15" />
          <span className="sr-only">
            {sheetExpanded ? "Collapse" : "Expand"} panel
          </span>
        </button>

        <div className="flex h-full w-full min-h-0 flex-col px-3 max-md:px-3 md:px-0">
          <nav
            className="grid shrink-0 grid-cols-5 gap-1 md:flex md:gap-0 md:border-b md:border-separator/70"
            aria-label="Designer sections"
          >
            {DESIGNER_STEPS.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === step;
              const complete = index < stepIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => goToStep(item.id)}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl bg-white text-[9px] font-semibold tracking-wide transition-[color,box-shadow,background-color,border-color] ring-1",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                    "md:min-h-0 md:flex-1 md:flex-row md:gap-1 md:rounded-none md:bg-transparent md:px-0.5 md:py-2.5 md:text-[11px] md:font-medium md:tracking-normal md:shadow-none md:ring-0",
                    "md:border-b-2 md:border-transparent md:focus-visible:ring-0 md:focus-visible:border-foreground/40",
                    active
                      ? "bg-foreground text-white shadow-sm ring-foreground md:bg-transparent md:text-foreground md:shadow-none md:ring-0 md:border-foreground"
                      : complete
                        ? "text-foreground ring-foreground/20 hover:ring-foreground/30 md:text-foreground/80 md:ring-0 md:hover:text-foreground md:hover:border-foreground/25"
                        : "text-foreground/65 ring-border/70 hover:text-foreground hover:ring-foreground/14 md:text-muted md:ring-0 md:hover:text-foreground md:hover:border-foreground/20",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5",
                      active ? "text-white md:text-foreground" : undefined,
                    )}
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <Card
            variant="secondary"
            className="mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl border-0 bg-white shadow-none ring-1 ring-border/55"
          >
            <Card.Content className="flex h-full min-h-0 flex-col p-0">
              <div className="flex shrink-0 items-start justify-between gap-2 border-b border-separator/70 px-3 py-2.5">
                <div className="min-w-0">
                  <h2 className="m-0 text-[1.05rem] font-semibold tracking-tight text-foreground">
                    {stepDef.header}
                  </h2>
                  <p className="m-0 mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                    {stepDef.hint}
                  </p>
                </div>
                {step === "order" ? (
                  <ToggleButtonGroup
                    size="sm"
                    selectionMode="single"
                    isDetached
                    disallowEmptySelection
                    selectedKeys={new Set([orderFocus])}
                    onSelectionChange={(keys) => {
                      const next = [...keys][0];
                      if (next === "review" || next === "export") setOrderFocus(next);
                    }}
                    className="shrink-0 gap-0.5 rounded-full"
                    aria-label="Order panel"
                  >
                    <ToggleButton
                      id="review"
                      className="min-h-9 rounded-full px-2.5 text-[11px] font-medium"
                    >
                      Review
                    </ToggleButton>
                    <ToggleButton
                      id="export"
                      className="min-h-9 rounded-full px-2.5 text-[11px] font-medium"
                    >
                      Export
                    </ToggleButton>
                  </ToggleButtonGroup>
                ) : null}
              </div>

              <div
                ref={panelScrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
              >
                <StepDetail step={step} orderFocus={orderFocus} />
              </div>

              {stepDef.nextLabel ? (
                <div className="flex shrink-0 gap-2 border-t border-separator/70 px-3 py-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    isDisabled={stepIndex === 0}
                    onPress={goBack}
                    className="min-h-11 min-w-11 px-3"
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="size-4" strokeWidth={1.75} />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <Button
                    size="sm"
                    onPress={goNext}
                    className="min-h-11 flex-1 font-semibold"
                  >
                    Continue to {stepDef.nextLabel}
                    <ChevronRight className="size-4" strokeWidth={1.75} />
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 gap-2 border-t border-separator/70 px-3 py-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={goBack}
                    className="min-h-11 flex-1"
                  >
                    <ChevronLeft className="size-4" strokeWidth={1.75} />
                    Back to Roster
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </Surface>

      <div className="relative order-1 min-h-0 flex-1 bg-[#f7f7f5] md:order-none md:bg-[#f4f4f2]">
        <GarmentCanvas />

        <div
          className="absolute z-20"
          style={{
            top: "max(10px, env(safe-area-inset-top, 0px))",
            right: "max(10px, env(safe-area-inset-right, 0px))",
          }}
        >
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Reset design"
            className="size-10 rounded-full bg-white/95 text-muted shadow-sm ring-1 ring-border/50 backdrop-blur-sm"
            onPress={() => setResetOpen(true)}
          >
            <RotateCcw className="size-3.5" strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      </div>

      <Modal>
        <Modal.Backdrop isOpen={resetOpen} onOpenChange={setResetOpen}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[340px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="font-semibold">Start a new design?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted">
                  Clears artwork, roster, and customer details.
                </p>
              </Modal.Body>
              <Modal.Footer className="gap-2">
                <Button variant="outline" slot="close" className="min-h-11">
                  Cancel
                </Button>
                <Button
                  className="min-h-11"
                  onPress={() => {
                    reset();
                    goToStep("product");
                    setOrderFocus("review");
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
