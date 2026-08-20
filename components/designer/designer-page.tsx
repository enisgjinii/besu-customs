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
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { GarmentCanvas } from "./garment-canvas";
import { ProductPanel } from "./product-panel";
import { PromptPanel } from "./prompt-panel";
import { ConceptPanel } from "./concept-panel";
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

function StepDetail({ step, orderFocus }: { step: DesignerStepId; orderFocus: OrderFocus }) {
  if (step === "product") return <ProductPanel />;
  if (step === "design") return <PromptPanel />;
  if (step === "concepts") return <ConceptPanel />;
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
  const navRef = useRef<HTMLElement>(null);

  const store = useDesignerStore();
  const stepIndex = store.activeStep;
  const step = stepIdFromIndex(stepIndex);
  const stepDef = DESIGNER_STEPS[stepIndex] || DESIGNER_STEPS[0];

  function canOpenStep(next: DesignerStepId) {
    if ((next === "refine" || next === "roster" || next === "order") && !store.selectedConceptId) return false;
    return true;
  }

  function goToStep(next: DesignerStepId) {
    if (!canOpenStep(next)) {
      store.setStep(STEP_INDEX.concepts as DesignerStep);
      return;
    }
    store.setStep(STEP_INDEX[next] as DesignerStep);
    panelScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (window.matchMedia("(max-width: 767px)").matches) setSheetExpanded(false);
    if (next === "order") setOrderFocus("review");
  }

  function goNext() {
    const next = stepDef.nextLabel ? DESIGNER_STEPS[stepIndex + 1]?.id : null;
    if (!next) return;
    if (step === "concepts" && !store.selectedConceptId) return;
    goToStep(next);
  }

  function goBack() {
    if (stepIndex <= 0) return;
    goToStep(DESIGNER_STEPS[stepIndex - 1].id);
  }

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

  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const active = navRef.current?.querySelector<HTMLElement>(`[data-step-index="${stepIndex}"]`);
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [stepIndex]);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        setSheetExpanded(true);
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  return (
    <main
      data-designer-shell="v11-mobile-pass"
      className="designer-shell flex h-[var(--designer-vvh,100dvh)] w-full overflow-hidden bg-[#f7f7f5] max-md:flex-col md:bg-white"
    >
      <Surface
        variant="default"
        className={cn(
          "relative z-30 flex shrink-0 overflow-hidden rounded-none border-0 bg-white",
          "md:h-full md:w-1/4 md:min-w-[340px] md:max-w-[460px] md:border-r md:border-separator md:px-3",
          "md:pb-[max(12px,env(safe-area-inset-bottom,0px))] md:pt-[max(12px,env(safe-area-inset-top,0px))]",
          "md:shadow-[8px_0_24px_rgba(15,23,42,0.03)]",
          "max-md:order-2 max-md:w-full max-md:min-w-0 max-md:max-w-none max-md:flex-col",
          "max-md:rounded-t-[24px] max-md:border-t max-md:border-separator/80",
          "max-md:shadow-[0_-14px_44px_rgba(15,23,42,0.10)]",
          "max-md:pb-[max(6px,env(safe-area-inset-bottom,0px))]",
          "max-md:transition-[height] max-md:duration-200 max-md:ease-out",
          sheetExpanded
            ? "max-md:h-[min(82dvh,760px)]"
            : "max-md:h-[clamp(360px,58dvh,540px)]",
        )}
      >
        <button
          type="button"
          className="flex min-h-8 w-full shrink-0 flex-col items-center justify-center gap-1 px-3 pb-1 pt-1.5 md:hidden"
          aria-expanded={sheetExpanded}
          aria-label={sheetExpanded ? "Collapse controls" : "Expand controls"}
          onClick={() => setSheetExpanded((open) => !open)}
        >
          <span className="h-1 w-11 rounded-full bg-foreground/20" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
            {sheetExpanded ? "More preview" : "More controls"}
          </span>
        </button>

        <div className="flex h-full w-full min-h-0 flex-col px-2.5 md:px-0">
          <nav
            ref={navRef}
            className="designer-mobile-tabs flex shrink-0 snap-x gap-1 overflow-x-auto px-0.5 pb-1 md:overflow-visible md:border-b md:border-separator/70 md:px-0 md:pb-0"
            aria-label="Designer sections"
          >
            {DESIGNER_STEPS.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === step;
              const complete = index < stepIndex;
              const locked = (item.id === "refine" || item.id === "roster" || item.id === "order") && !store.selectedConceptId;
              return (
                <button
                  key={item.id}
                  data-step-index={index}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  aria-disabled={locked}
                  disabled={locked}
                  onClick={() => goToStep(item.id)}
                  className={cn(
                    "flex min-h-12 min-w-[72px] flex-none snap-start flex-col items-center justify-center gap-0.5 rounded-xl bg-white px-1.5 text-[10px] font-semibold tracking-tight transition-[color,box-shadow,background-color,border-color] ring-1",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 disabled:cursor-not-allowed disabled:opacity-35",
                    "md:min-h-0 md:min-w-0 md:flex-1 md:flex-row md:gap-1 md:rounded-none md:bg-transparent md:px-0.5 md:py-2.5 md:text-[10px] md:font-medium md:tracking-normal md:shadow-none md:ring-0",
                    "md:border-b-2 md:border-transparent md:focus-visible:ring-0 md:focus-visible:border-foreground/40",
                    active
                      ? "bg-foreground text-white shadow-sm ring-foreground md:bg-transparent md:text-foreground md:shadow-none md:ring-0 md:border-foreground"
                      : complete
                        ? "text-foreground ring-foreground/20 hover:ring-foreground/30 md:text-foreground/80 md:ring-0 md:hover:text-foreground md:hover:border-foreground/25"
                        : "text-foreground/65 ring-border/70 hover:text-foreground hover:ring-foreground/14 md:text-muted md:ring-0 md:hover:text-foreground md:hover:border-foreground/20",
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-white md:text-foreground" : undefined)} strokeWidth={1.7} aria-hidden />
                  <span className="leading-none">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <Card
            variant="secondary"
            className="mt-1.5 min-h-0 flex-1 overflow-hidden rounded-[18px] border-0 bg-white shadow-none ring-1 ring-border/55 md:mt-2 md:rounded-2xl"
          >
            <Card.Content className="flex h-full min-h-0 flex-col p-0">
              <div className="flex shrink-0 items-start justify-between gap-2 border-b border-separator/70 px-3 py-2.5">
                <div className="min-w-0">
                  <h2 className="m-0 truncate text-[1rem] font-semibold tracking-tight text-foreground md:text-[1.05rem]">{stepDef.header}</h2>
                  <p className={cn("m-0 mt-0.5 text-[11px] leading-snug text-muted", sheetExpanded ? "line-clamp-2" : "line-clamp-1 md:line-clamp-2")}>{stepDef.hint}</p>
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
                    <ToggleButton id="review" className="min-h-9 rounded-full px-2.5 text-[11px] font-medium">Review</ToggleButton>
                    <ToggleButton id="export" className="min-h-9 rounded-full px-2.5 text-[11px] font-medium">Export</ToggleButton>
                  </ToggleButtonGroup>
                ) : null}
              </div>

              <div
                ref={panelScrollRef}
                data-designer-panel-scroll
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-6 [scrollbar-width:thin]"
              >
                <StepDetail step={step} orderFocus={orderFocus} />
              </div>

              {stepDef.nextLabel ? (
                <div className="flex shrink-0 gap-2 border-t border-separator/70 bg-white/95 px-3 py-2.5 backdrop-blur-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    isDisabled={stepIndex === 0}
                    onPress={goBack}
                    className="min-h-11 min-w-11 px-3"
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="size-4" strokeWidth={1.75} />
                    <span className="hidden min-[380px]:inline">Back</span>
                  </Button>
                  <Button
                    size="sm"
                    onPress={goNext}
                    isDisabled={step === "concepts" && !store.selectedConceptId}
                    className="min-h-11 min-w-0 flex-1 font-semibold"
                  >
                    <span className="truncate">Continue to {stepDef.nextLabel}</span>
                    <ChevronRight className="size-4 shrink-0" strokeWidth={1.75} />
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 gap-2 border-t border-separator/70 bg-white/95 px-3 py-2.5 backdrop-blur-sm">
                  <Button variant="outline" size="sm" onPress={goBack} className="min-h-11 flex-1">
                    <ChevronLeft className="size-4" strokeWidth={1.75} />Back to Roster
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </Surface>

      <div className="relative order-1 min-h-[120px] flex-1 bg-[#f7f7f5] md:order-none md:min-h-0 md:bg-[#f4f4f2]">
        <GarmentCanvas />
        <div
          className="absolute z-30"
          style={{
            top: "max(8px, env(safe-area-inset-top, 0px))",
            right: "max(8px, env(safe-area-inset-right, 0px))",
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
            <Modal.Dialog className="max-md:mx-3 max-md:w-[calc(100%-1.5rem)] sm:max-w-[340px]">
              <Modal.CloseTrigger />
              <Modal.Header><Modal.Heading className="font-semibold">Start a new design?</Modal.Heading></Modal.Header>
              <Modal.Body><p className="text-sm text-muted">Clears concepts, selected artwork, roster, and customer details.</p></Modal.Body>
              <Modal.Footer className="gap-2 max-[360px]:flex-col-reverse">
                <Button variant="outline" slot="close" className="min-h-11 max-[360px]:w-full">Cancel</Button>
                <Button className="min-h-11 max-[360px]:w-full" onPress={() => { store.reset(); store.setStep(0); setOrderFocus("review"); setResetOpen(false); }}>Clear design</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </main>
  );
}
