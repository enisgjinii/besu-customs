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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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

const ease = [0.22, 1, 0.36, 1] as const;

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
  const reduceMotion = useReducedMotion();

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
    panelRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    if (resolved === "order") setOrderFocus("review");

    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => {
        controlsRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
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
    <motion.main
      data-designer-shell="v16-framer-motion"
      className="flex min-h-dvh w-full flex-col bg-[#f7f7f5] text-foreground md:h-dvh md:min-h-0 md:flex-row md:overflow-hidden md:bg-white"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <Surface
        ref={controlsRef}
        variant="default"
        className={cn(
          "order-3 w-full rounded-none border-0 bg-white md:order-none md:relative md:z-30 md:flex md:h-full md:w-1/4 md:min-w-[340px] md:max-w-[460px] md:shrink-0 md:overflow-hidden md:border-r md:border-separator md:px-3",
          "md:pb-[max(12px,env(safe-area-inset-bottom,0px))] md:pt-[max(12px,env(safe-area-inset-top,0px))]",
        )}
      >
        <div className="flex w-full min-w-0 flex-col md:h-full md:min-h-0">
          <nav
            aria-label="Designer sections"
            className="sticky top-0 z-40 flex overflow-x-auto border-y border-border/70 bg-white px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:static md:z-auto md:overflow-visible md:border-x-0 md:border-t-0 md:px-0"
          >
            {DESIGNER_STEPS.map((item) => {
              const active = item.id === step;
              const locked =
                (item.id === "refine" || item.id === "roster" || item.id === "order") &&
                !store.selectedConceptId;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  aria-disabled={locked}
                  disabled={locked}
                  onClick={() => goToStep(item.id)}
                  whileTap={reduceMotion || locked ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.14, ease }}
                  className={cn(
                    "relative min-h-11 shrink-0 border-b-2 px-3 text-[11px] font-medium transition-colors focus-visible:outline-none disabled:opacity-30 md:min-w-0 md:flex-1 md:px-1 md:text-[10px]",
                    active
                      ? "border-transparent text-foreground"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="designer-active-tab"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground"
                      transition={{ duration: reduceMotion ? 0 : 0.22, ease }}
                    />
                  ) : null}
                </motion.button>
              );
            })}
          </nav>

          <Card className="m-3 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-none md:m-0 md:mt-2 md:min-h-0 md:flex-1 md:border-0 md:ring-1 md:ring-border/55">
            <Card.Content className="flex p-0 md:h-full md:min-h-0 md:flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 md:px-3">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.h2
                    key={stepDef.header}
                    className="m-0 text-[17px] font-semibold tracking-tight md:text-[1rem]"
                    initial={reduceMotion ? false : { opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
                    transition={{ duration: reduceMotion ? 0 : 0.16, ease }}
                  >
                    {stepDef.header}
                  </motion.h2>
                </AnimatePresence>

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
                    className="shrink-0 gap-0.5"
                    aria-label="Order panel"
                  >
                    <ToggleButton id="review" className="min-h-8 px-2.5 text-[11px]">Review</ToggleButton>
                    <ToggleButton id="export" className="min-h-8 px-2.5 text-[11px]">Files</ToggleButton>
                  </ToggleButtonGroup>
                ) : null}
              </div>

              <div
                ref={panelRef}
                className="px-4 py-4 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:px-3 md:py-3 md:[scrollbar-width:thin]"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${step}-${step === "order" ? orderFocus : "default"}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease }}
                  >
                    <StepDetail step={step} orderFocus={orderFocus} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <motion.div
                className="border-t border-border/70 bg-white px-4 py-3 md:shrink-0 md:px-3 md:py-2.5"
                layout
                transition={{ duration: reduceMotion ? 0 : 0.18, ease }}
              >
                {stepDef.nextLabel ? (
                  <div className="grid grid-cols-[auto_1fr] gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isDisabled={stepIndex === 0}
                      onPress={goBack}
                      className="min-h-11 px-4"
                    >
                      Back
                    </Button>
                    <Button
                      size="sm"
                      onPress={goNext}
                      isDisabled={step === "concepts" && !store.selectedConceptId}
                      className="min-h-11 font-semibold"
                    >
                      Continue
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" fullWidth onPress={goBack} className="min-h-11">
                    Back
                  </Button>
                )}
              </motion.div>
            </Card.Content>
          </Card>
        </div>
      </Surface>

      <motion.section
        className="relative order-2 h-[clamp(230px,38svh,340px)] shrink-0 bg-[#f4f4f2] p-3 md:order-none md:h-full md:min-h-0 md:flex-1 md:p-0"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.26, ease }}
      >
        <GarmentCanvas />
        <motion.button
          type="button"
          onClick={() => setResetOpen(true)}
          whileHover={reduceMotion ? undefined : { y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="absolute right-4 top-4 hidden min-h-9 rounded-lg bg-white/90 px-3 text-[11px] font-medium text-muted ring-1 ring-border/60 md:block"
        >
          Reset
        </motion.button>
      </motion.section>

      <Modal>
        <Modal.Backdrop isOpen={resetOpen} onOpenChange={setResetOpen}>
          <Modal.Container>
            <Modal.Dialog className="max-md:mx-3 max-md:w-[calc(100%-1.5rem)] sm:max-w-[340px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="font-semibold">New design?</Modal.Heading>
              </Modal.Header>
              <Modal.Footer className="gap-2">
                <Button variant="outline" slot="close" className="min-h-11">Cancel</Button>
                <Button className="min-h-11" onPress={resetDesign}>Reset</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </motion.main>
  );
}
