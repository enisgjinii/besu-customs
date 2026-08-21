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

export function DesignerPage() {
  const [orderFocus, setOrderFocus] = useState<OrderFocus>("review");
  const [resetOpen, setResetOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const store = useDesignerStore();
  const stepIndex = store.activeStep;
  const step = stepIdFromIndex(stepIndex);
  const stepDef = DESIGNER_STEPS[stepIndex] || DESIGNER_STEPS[0];

  function canOpenStep(next: DesignerStepId) {
    return !(
      (next === "refine" || next === "roster" || next === "order") &&
      !store.selectedConceptId
    );
  }

  function goToStep(next: DesignerStepId) {
    const resolved = canOpenStep(next) ? next : "concepts";
    store.setStep(STEP_INDEX[resolved] as DesignerStep);
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (resolved === "order") setOrderFocus("review");

    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => {
        controlsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return (
    <main
      data-designer-shell="v13-simple-responsive"
      className="flex min-h-dvh w-full flex-col bg-[#f7f7f5] text-foreground md:h-dvh md:min-h-0 md:flex-row md:overflow-hidden md:bg-white"
    >
      {/* Simple mobile header. Desktop keeps the existing sidebar + canvas composition. */}
      <header className="order-1 flex items-center justify-between gap-3 border-b border-border/70 bg-white px-4 pb-3 pt-[max(12px,env(safe-area-inset-top,0px))] md:hidden">
        <div className="min-w-0">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Besu Customs</p>
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

      {/* Controls: normal page content on mobile, fixed sidebar on desktop. */}
      <Surface
        ref={controlsRef}
        variant="default"
        className={cn(
          "order-3 w-full rounded-none border-0 bg-white md:order-none md:relative md:z-30 md:flex md:h-full md:w-1/4 md:min-w-[340px] md:max-w-[460px] md:shrink-0 md:overflow-hidden md:border-r md:border-separator md:px-3",
          "md:pb-[max(12px,env(safe-area-inset-bottom,0px))] md:pt-[max(12px,env(safe-area-inset-top,0px))] md:shadow-[8px_0_24px_rgba(15,23,42,0.03)]",
        )}
      >
        <div className="flex w-full min-w-0 flex-col md:h-full md:min-h-0">
          <nav
            aria-label="Designer sections"
            className="sticky top-0 z-40 flex gap-1.5 overflow-x-auto border-y border-border/70 bg-[#f7f7f5]/95 px-3 py-2 backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:static md:z-auto md:gap-0 md:overflow-visible md:border-x-0 md:border-t-0 md:bg-white md:px-0 md:py-0 md:backdrop-blur-none"
          >
            {DESIGNER_STEPS.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === step;
              const complete = index < stepIndex;
              const locked =
                (item.id === "refine" || item.id === "roster" || item.id === "order") &&
                !store.selectedConceptId;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  aria-disabled={locked}
                  disabled={locked}
                  onClick={() => goToStep(item.id)}
                  className={cn(
                    "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold ring-1 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 disabled:cursor-not-allowed disabled:opacity-35",
                    "md:min-h-0 md:min-w-0 md:flex-1 md:justify-center md:gap-1 md:rounded-none md:border-b-2 md:border-transparent md:px-0.5 md:py-2.5 md:text-[10px] md:font-medium md:ring-0",
                    active
                      ? "bg-foreground text-white ring-foreground md:border-foreground md:bg-white md:text-foreground"
                      : complete
                        ? "bg-white text-foreground ring-foreground/20 md:text-foreground/80"
                        : "bg-white text-muted ring-border/70 md:text-muted",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" strokeWidth={1.7} aria-hidden />
                  <span className="md:hidden">{index + 1}. </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <Card
            className="m-3 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-none md:m-0 md:mt-2 md:min-h-0 md:flex-1 md:border-0 md:ring-1 md:ring-border/55"
          >
            <Card.Content className="flex p-0 md:h-full md:min-h-0 md:flex-col">
              <div className="border-b border-border/70 px-4 py-3 md:flex md:shrink-0 md:items-start md:justify-between md:gap-2 md:px-3 md:py-2.5">
                <div className="flex items-start justify-between gap-3 md:contents">
                  <div className="min-w-0">
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted md:hidden">
                      Step {stepIndex + 1} of {DESIGNER_STEPS.length}
                    </p>
                    <h2 className="m-0 mt-0.5 text-[17px] font-semibold tracking-tight md:mt-0 md:text-[1.05rem]">{stepDef.header}</h2>
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

                <p className="m-0 mt-1.5 text-[12px] leading-relaxed text-muted md:mt-0.5 md:line-clamp-2 md:text-[11px] md:leading-snug">
                  {stepDef.hint}
                </p>
              </div>

              <div
                ref={panelRef}
                className="px-4 py-4 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:px-3 md:py-3 md:[scrollbar-width:thin]"
              >
                <StepDetail step={step} orderFocus={orderFocus} />
              </div>

              <div className="border-t border-border/70 bg-[#fafaf9] px-4 py-3 md:shrink-0 md:bg-white md:px-3 md:py-2.5">
                {stepDef.nextLabel ? (
                  <div className="grid grid-cols-[auto_1fr] gap-2 md:flex">
                    <Button
                      variant="outline"
                      size="sm"
                      isDisabled={stepIndex === 0}
                      onPress={goBack}
                      className="min-h-11 px-3 md:min-w-11"
                      aria-label="Previous step"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden min-[360px]:inline">Back</span>
                    </Button>
                    <Button
                      size="sm"
                      onPress={goNext}
                      isDisabled={step === "concepts" && !store.selectedConceptId}
                      className="min-h-11 min-w-0 font-semibold md:flex-1"
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
      </Surface>

      {/* Preview is simply above controls on mobile and right of the sidebar on desktop. */}
      <section className="order-2 h-[clamp(230px,38svh,340px)] shrink-0 bg-[#f4f4f2] p-3 md:order-none md:h-full md:min-h-0 md:flex-1 md:p-0">
        <GarmentCanvas />

        <div
          className="absolute z-30 hidden md:block"
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
      </section>

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
