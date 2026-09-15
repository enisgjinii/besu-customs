"use client";

import { useRef, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { GarmentCanvas } from "./garment-canvas";
import { ProductPanel } from "./product-panel";
import { PromptPanel } from "./prompt-panel";
import { ConceptPanel } from "./concept-panel";
import { RefinePanel } from "./refine-panel";
import { OrderPanel } from "./order-panel";
import { StudioPromptBar } from "./studio-prompt-bar";
import {
  DESIGNER_STEPS,
  STEP_INDEX,
  type DesignerStepId,
} from "./designer-steps";
import { useDesignerStore } from "@/lib/designer/store";
import { useGenerationSession } from "@/lib/designer/generation-session";
import { useSharedDesign } from "@/hooks/use-shared-design";
import type { DesignerStep } from "@/lib/designer/types";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

function StepDetail({ step }: { step: DesignerStepId }) {
  if (step === "product") return <ProductPanel />;
  if (step === "design") return <PromptPanel />;
  if (step === "concepts") return <ConceptPanel />;
  if (step === "refine") return <RefinePanel />;
  return <OrderPanel />;
}

function stepIdFromIndex(index: DesignerStep): DesignerStepId {
  return DESIGNER_STEPS[index]?.id ?? "product";
}

export function DesignerPage() {
  const [resetOpen, setResetOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const store = useDesignerStore();
  const stepIndex = store.activeStep;
  const step = stepIdFromIndex(stepIndex);
  const stepDef = DESIGNER_STEPS[stepIndex] || DESIGNER_STEPS[0];
  useSharedDesign();

  function canOpenStep(next: DesignerStepId) {
    return !(
      (next === "refine" || next === "order") &&
      !store.selectedConceptId
    );
  }

  function goToStep(next: DesignerStepId) {
    const resolved = canOpenStep(next) ? next : "concepts";
    store.setStep(STEP_INDEX[resolved] as DesignerStep);
    panelRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => {
        controlsRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
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
    useGenerationSession.getState().reset();
    store.setStep(0);
    setResetOpen(false);
  }

  return (
    <motion.main
      data-designer-shell="v18-unified-order"
      className="flex min-h-dvh w-full flex-col bg-[#efeee9] text-foreground md:h-dvh md:min-h-0 md:flex-row md:overflow-hidden"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
    >
      <aside
        ref={controlsRef}
        className="order-3 w-full bg-[#fcfcfa] md:order-none md:flex md:h-full md:w-[390px] md:min-w-[350px] md:max-w-[420px] md:shrink-0 md:border-r md:border-black/[0.06]"
      >
        <div className="flex w-full min-w-0 flex-col md:h-full md:min-h-0">
          <nav
            aria-label="Designer sections"
            className="sticky top-0 z-40 bg-[#fcfcfa]/95 px-3 py-2 backdrop-blur-md md:static md:shrink-0"
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#181816] text-white shadow-sm">
                  <Sparkles className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0 leading-none">
                  <p className="m-0 text-[11px] font-bold tracking-[0.12em]">BESU</p>
                  <p className="mt-1 truncate text-[9.5px] font-medium text-muted">AI Uniform Studio</p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-2.5 py-1.5 text-[9px] font-semibold text-foreground/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                GPT Image 2
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl bg-black/[0.035] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-0.5 md:min-w-0">
              {DESIGNER_STEPS.map((item) => {
                const active = item.id === step;
                const locked =
                  (item.id === "refine" || item.id === "order") &&
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
                    className={cn(
                      "relative min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 md:min-w-0 md:flex-1 md:px-1.5 md:text-[10px]",
                      active ? "text-white" : "text-muted hover:text-foreground",
                      locked && "opacity-25",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="designer-active-tab"
                        className="absolute inset-0 rounded-lg bg-[#181816]"
                        transition={{ duration: reduceMotion ? 0 : 0.22, ease }}
                      />
                    ) : null}
                    <span className="relative z-10 flex items-center justify-center gap-1"><span className="text-[8px] opacity-60">{String(DESIGNER_STEPS.indexOf(item) + 1).padStart(2, "0")}</span><span>{item.label}</span></span>
                  </motion.button>
                );
              })}
              </div>
            </div>
          </nav>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-3 md:px-5 md:pt-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.h2
                  key={stepDef.header}
                  className="m-0 text-[15px] font-semibold tracking-[-0.02em]"
                  initial={reduceMotion ? false : { opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
                  transition={{ duration: reduceMotion ? 0 : 0.15, ease }}
                >
                  {stepDef.header}
                </motion.h2>
              </AnimatePresence>
            </div>

            <div
              ref={panelRef}
              className="min-h-0 px-4 pb-4 md:flex-1 md:overflow-y-auto md:overscroll-contain md:px-5 md:[scrollbar-width:thin]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18, ease }}
                >
                  <StepDetail step={step} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="shrink-0 bg-[#fcfcfa] px-4 pb-[max(14px,env(safe-area-inset-bottom,0px))] pt-1 md:px-5 md:pb-5 md:pt-3">
              {stepDef.nextLabel ? (
                stepIndex === 0 ? (
                  <Button fullWidth size="sm" onPress={goNext} className="min-h-11 rounded-xl font-semibold">
                    Continue
                  </Button>
                ) : (
                  <div className="grid grid-cols-[84px_1fr] gap-2">
                    <Button variant="ghost" size="sm" onPress={goBack} className="min-h-11 rounded-xl text-muted">
                      Back
                    </Button>
                    <Button
                      size="sm"
                      onPress={goNext}
                      isDisabled={step === "concepts" && !store.selectedConceptId}
                      className="min-h-11 rounded-xl font-semibold"
                    >
                      Continue
                    </Button>
                  </div>
                )
              ) : (
                <Button variant="ghost" size="sm" fullWidth onPress={goBack} className="min-h-11 rounded-xl text-muted">
                  Back
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <motion.section
        className="relative order-2 h-[clamp(280px,46svh,420px)] shrink-0 bg-[#efeee9] p-2 md:order-none md:h-full md:min-h-0 md:flex-1 md:p-4"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.997 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.24, ease }}
      >
        <GarmentCanvas />
        <StudioPromptBar />
        <motion.button
          type="button"
          onClick={() => setResetOpen(true)}
          whileHover={reduceMotion ? undefined : { y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          aria-label="Reset design"
          title="Reset design"
          className="absolute right-5 top-[4.25rem] z-30 flex min-h-8 items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/92 px-2.5 text-[9px] font-semibold text-foreground/70 shadow-sm backdrop-blur transition-colors hover:text-foreground md:right-7 md:top-[4.75rem] md:px-3 md:text-[10px]"
        >
          <RotateCcw className="size-3" aria-hidden />
          <span>Reset</span>
        </motion.button>
      </motion.section>

      <Modal>
        <Modal.Backdrop isOpen={resetOpen} onOpenChange={setResetOpen}>
          <Modal.Container>
            <Modal.Dialog className="max-md:mx-3 max-md:w-[calc(100%-1.5rem)] sm:max-w-[320px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="font-semibold">Start over?</Modal.Heading>
              </Modal.Header>
              <Modal.Footer className="gap-2">
                <Button variant="ghost" slot="close" className="min-h-10">Cancel</Button>
                <Button className="min-h-10" onPress={resetDesign}>Start new</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </motion.main>
  );
}
