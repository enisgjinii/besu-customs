"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Modal,
  Surface,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import {
  FlipHorizontal2,
  RotateCcw,
  Shirt,
} from "lucide-react";
import { GarmentCanvas } from "./garment-canvas";
import { PromptPanel } from "./prompt-panel";
import { ArtworkControls } from "./artwork-controls";
import { OrderPanel } from "./order-panel";
import {
  DESIGNER_STEPS,
  STEP_INDEX,
  type DesignerStepId,
} from "./designer-steps";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

type OrderFocus = "review" | "export";

function StepDetail({
  step,
  orderFocus,
}: {
  step: DesignerStepId;
  orderFocus: OrderFocus;
}) {
  if (step === "design") return <PromptPanel />;
  if (step === "place") return <ArtworkControls />;
  if (step === "roster") return <OrderPanel mode="roster" />;
  return <OrderPanel mode="review" focus={orderFocus} />;
}

export function DesignerPage() {
  const [step, setStep] = useState<DesignerStepId>("design");
  const [orderFocus, setOrderFocus] = useState<OrderFocus>("review");
  const [resetOpen, setResetOpen] = useState(false);

  const store = useDesignerStore();
  const reset = store.reset;
  const stepIndex = STEP_INDEX[step];
  const stepDef = DESIGNER_STEPS[stepIndex];

  return (
    <main
      data-designer-shell="v7-left-sidebar"
      className="flex h-dvh w-full overflow-hidden bg-white max-md:flex-col"
    >
      <Surface
        variant="default"
        className="relative z-30 flex h-full w-1/4 min-w-[320px] max-w-[430px] shrink-0 overflow-hidden rounded-none border-0 border-r border-separator bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-[max(12px,env(safe-area-inset-top,0px))] shadow-[8px_0_24px_rgba(15,23,42,0.03)] max-md:h-[44dvh] max-md:max-h-[360px] max-md:w-full max-md:max-w-none max-md:min-w-0 max-md:border-b max-md:border-r-0 max-md:shadow-[0_8px_24px_rgba(15,23,42,0.03)]"
      >
        <div className="flex h-full w-full min-h-0 flex-col">
          <nav
            className="grid shrink-0 grid-cols-4 gap-1.5"
            aria-label="Designer sections"
          >
            {DESIGNER_STEPS.map((item) => {
              const Icon = item.icon;
              const active = item.id === step;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setStep(item.id)}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl bg-white text-[10px] font-medium transition-colors ring-1",
                    active
                      ? "text-foreground shadow-sm ring-foreground/18"
                      : "text-foreground/70 ring-border/70 hover:text-foreground hover:ring-foreground/14",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.55} aria-hidden />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <Card
            variant="secondary"
            className="mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl border-0 bg-white shadow-none ring-1 ring-border/60"
          >
            <Card.Content className="h-full overflow-y-auto overscroll-contain p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="m-0 text-[1.05rem] font-semibold tracking-tight text-foreground">
                  {stepDef.header}
                </h2>
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
                    className="gap-0.5 rounded-full"
                    aria-label="Order panel"
                  >
                    <ToggleButton id="review" className="rounded-full px-2 text-[11px] font-medium">
                      Review
                    </ToggleButton>
                    <ToggleButton id="export" className="rounded-full px-2 text-[11px] font-medium">
                      Export
                    </ToggleButton>
                  </ToggleButtonGroup>
                ) : null}
              </div>
              <StepDetail step={step} orderFocus={orderFocus} />
            </Card.Content>
          </Card>
        </div>
      </Surface>

      <div className="relative min-h-0 flex-1 bg-white">
        <GarmentCanvas />

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
            className="pointer-events-auto gap-0.5 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-border/60"
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
            className="size-8 rounded-full bg-white text-muted shadow-sm ring-1 ring-border/50"
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
                <Button variant="outline" slot="close">
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    reset();
                    setStep("design");
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
