"use client";

import { useRef, useState } from "react";
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

function StepTabs({
  step,
  stepIndex,
  selectedConceptId,
  onStep,
  mobile = false,
}: {
  step: DesignerStepId;
  stepIndex: number;
  selectedConceptId?: string;
  onStep: (step: DesignerStepId) => void;
  mobile?: boolean;
}) {
  return (
    <nav
      aria-label="Designer sections"
      className={cn(
        mobile
          ? "flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex border-b border-separator/70",
      )}
    >
      {DESIGNER_STEPS.map((item, index) => {
        const Icon = item.icon;
        const active = item.id === step;
        const complete = index < stepIndex;
        const locked =
          (item.id === "refine" || item.id === "roster" || item.id === "order") &&
          !selectedConceptId;

        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            aria-disabled={locked}
            disabled={locked}
            onClick={() => onStep(item.id)}
            className={cn(
              mobile
                ? "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold ring-1 transition-colors"
                : "flex min-h-0 flex-1 items-center justify-center gap-1 border-b-2 border-transparent px-0.5 py-2.5 text-[10px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 disabled:cursor-not-allowed disabled:opacity-35",
              mobile
                ? active
                  ? "bg-foreground text-white ring-foreground"
                  : complete
                    ? "bg-white text-foreground ring-foreground/20"
                    : "bg-white text-muted ring-border/70"
                : active
                  ? "border-foreground text-foreground"
                  : complete
                    ? "text-foreground/80 hover:border-foreground/25 hover:text-foreground"
                    : "text-muted hover:border-foreground/20 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.7} aria-hidden />
            <span>{mobile ? `${index + 1}. ${item.label}` : item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function DesignerPage() {
  const [orderFocus, setOrderFocus] = useState<OrderFocus>("review");
  const [resetOpen, setResetOpen] = useState(false);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const mobileContentRef = useRef<HTMLDivElement>(null);

  const store = useDesignerStore();
  const stepIndex = store.activeStep;
  const step = stepIdFromIndex(stepIndex);
  const stepDef = DESIGNER_STEPS[stepIndex] || DESIGNER_STEPS[0];

  function canOpenStep(next: DesignerStepId) {
    if ((next === "refine" || next === "roster" || next === "order") && !store.selectedConceptId) {
      return false;
    }
    return true;
  }

  function goToStep(next: DesignerStepId) {
    const resolved = canOpenStep(next) ? next : "concepts";
    store.setStep(STEP_INDEX[resolved] as DesignerStep);
    desktopPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (resolved === "order") setOrderFocus("review");

    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => {
        mobileContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
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

  function resetDesign() {
    store.reset();
    store.setStep(0);
    setOrderFocus("review");
    setResetOpen(false);
  }

  const orderToggle = step === "order" ? (
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
      <ToggleButton id="review" className="min-h-9 rounded-full px-2.5 text-[11px] font-medium">
        Review
      </ToggleButton>
      <ToggleButton id="export" className="min-h-9 rounded-full px-2.5 text-[11px] font-medium">
        Export
      </ToggleButton>
    </ToggleButtonGroup>
  ) : null;

  return (
    <main data-designer-shell="v12-simple-mobile" className="w-full bg-[#f7f7f5] text-foreground">
      {/* Mobile: simple document flow. No bottom sheet, no expand/collapse, no fixed-height controls. */}
      <div className="min-h-dvh md:hidden">
        <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-white px-4 pb-3 pt-[max(12px,env(safe-area-inset-top,0px))]">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Besu Customs</p>
            <h1 className="m-0 mt-0.5 truncate text-[16px] font-semibold tracking-tight">AI Uniform Designer</h1>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="outline"
            aria-label="Reset design"
            className="size-10 shrink-0 rounded-full bg-white"
            onPress={() => setResetOpen(true)}
          >
            <RotateCcw className="size-4" strokeWidth={1.75} />
          </Button>
        </header>

        <section className="h-[clamp(230px,38svh,340px)] bg-[#f4f4f2] p-3">
          <GarmentCanvas />
        </section>

        <div className="sticky top-0 z-40 border-y border-border/70 bg-[#f7f7f5]/95 backdrop-blur-sm">
          <StepTabs
            mobile
            step={step}
            stepIndex={stepIndex}
            selectedConceptId={store.selectedConceptId}
            onStep={goToStep}
          />
        </div>

        <div ref={mobileContentRef} className="scroll-mt-16 px-3 pb-[max(24px,env(safe-area-inset-bottom,0px))] pt-3">
          <Card className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-none">
            <Card.Content className="p-0">
              <div className="border-b border-border/70 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Step {stepIndex + 1} of {DESIGNER_STEPS.length}
                    </p>
                    <h2 className="m-0 mt-0.5 text-[17px] font-semibold tracking-tight">{stepDef.header}</h2>
                  </div>
                  {orderToggle}
                </div>
                <p className="m-0 mt-1.5 text-[12px] leading-relaxed text-muted">{stepDef.hint}</p>
              </div>

              <div className="px-4 py-4">
                <StepDetail step={step} orderFocus={orderFocus} />
              </div>

              <div className="border-t border-border/70 bg-[#fafaf9] px-4 py-3">
                {stepDef.nextLabel ? (
                  <div className="grid grid-cols-[auto_1fr] gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isDisabled={stepIndex === 0}
                      onPress={goBack}
                      className="min-h-11 px-3"
                      aria-label="Previous step"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden min-[360px]:inline">Back</span>
                    </Button>
                    <Button
                      size="sm"
                      onPress={goNext}
                      isDisabled={step === "concepts" && !store.selectedConceptId}
                      className="min-h-11 min-w-0 font-semibold"
                    >
                      <span className="truncate">Continue to {stepDef.nextLabel}</span>
                      <ChevronRight className="size-4 shrink-0" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" fullWidth onPress={goBack} className="min-h-11">
                    <ChevronLeft className="size-4" /> Back to Roster
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Desktop: keep the proven two-panel layout. */}
      <div className="hidden h-dvh w-full overflow-hidden bg-white md:flex">
        <Surface
          variant="default"
          className="relative z-30 flex h-full w-1/4 min-w-[340px] max-w-[460px] shrink-0 overflow-hidden rounded-none border-0 border-r border-separator bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-[max(12px,env(safe-area-inset-top,0px))] shadow-[8px_0_24px_rgba(15,23,42,0.03)]"
        >
          <div className="flex h-full w-full min-h-0 flex-col">
            <StepTabs
              step={step}
              stepIndex={stepIndex}
              selectedConceptId={store.selectedConceptId}
              onStep={goToStep}
            />

            <Card variant="secondary" className="mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl border-0 bg-white shadow-none ring-1 ring-border/55">
              <Card.Content className="flex h-full min-h-0 flex-col p-0">
                <div className="flex shrink-0 items-start justify-between gap-2 border-b border-separator/70 px-3 py-2.5">
                  <div className="min-w-0">
                    <h2 className="m-0 text-[1.05rem] font-semibold tracking-tight">{stepDef.header}</h2>
                    <p className="m-0 mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{stepDef.hint}</p>
                  </div>
                  {orderToggle}
                </div>

                <div ref={desktopPanelRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-width:thin]">
                  <StepDetail step={step} orderFocus={orderFocus} />
                </div>

                <div className="shrink-0 border-t border-separator/70 bg-white px-3 py-2.5">
                  {stepDef.nextLabel ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" isDisabled={stepIndex === 0} onPress={goBack} className="min-h-11 min-w-11 px-3">
                        <ChevronLeft className="size-4" /> Back
                      </Button>
                      <Button size="sm" onPress={goNext} isDisabled={step === "concepts" && !store.selectedConceptId} className="min-h-11 min-w-0 flex-1 font-semibold">
                        <span className="truncate">Continue to {stepDef.nextLabel}</span>
                        <ChevronRight className="size-4 shrink-0" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" fullWidth onPress={goBack} className="min-h-11">
                      <ChevronLeft className="size-4" /> Back to Roster
                    </Button>
                  )}
                </div>
              </Card.Content>
            </Card>
          </div>
        </Surface>

        <div className="relative min-h-0 flex-1 bg-[#f4f4f2]">
          <GarmentCanvas />
          <div
            className="absolute z-30"
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
              <RotateCcw className="size-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </div>

      <Modal>
        <Modal.Backdrop isOpen={resetOpen} onOpenChange={setResetOpen}>
          <Modal.Container>
            <Modal.Dialog className="max-md:mx-3 max-md:w-[calc(100%-1.5rem)] sm:max-w-[340px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="font-semibold">Start a new design?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted">Clears concepts, selected artwork, roster, and customer details.</p>
              </Modal.Body>
              <Modal.Footer className="gap-2 max-[360px]:flex-col-reverse">
                <Button variant="outline" slot="close" className="min-h-11 max-[360px]:w-full">Cancel</Button>
                <Button className="min-h-11 max-[360px]:w-full" onPress={resetDesign}>Clear design</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </main>
  );
}
