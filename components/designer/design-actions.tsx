"use client";

import { useRef, useState } from "react";
import { Button, Input, Label, Modal, Spinner, TextField } from "@heroui/react";
import { Bookmark, Link2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { useDesignerStore } from "@/lib/designer/store";
import { copyShareLink, toSharePayload } from "@/lib/designer/share";
import {
  listSavedDesigns,
  saveDesign,
  deleteSavedDesign,
  type SavedDesign,
} from "@/lib/designer/saved-designs";
import { cn } from "@/lib/utils";

export function DesignActions() {
  const s = useDesignerStore();
  const [copied, setCopied] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [designName, setDesignName] = useState("");
  const [savedList, setSavedList] = useState<SavedDesign[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const initialName = useRef(s.teamName || "My besu design");

  const canShare = boostable(s);
  const canSave = boostable(s);

  function refreshSavedList() {
    setSavedList(listSavedDesigns());
  }

  async function handleShare() {
    const ok = await copyShareLink(toSharePayload(useDesignerStore.getState()));
    if (ok) {
      setCopied(true);
      toast.success("Design link copied.");
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error("Could not copy the design link.");
    }
  }

  function handleSave() {
    const name = designName.trim() || initialName.current || "My besu design";
    setSaving(true);
    try {
      saveDesign(name, useDesignerStore.getState());
      refreshSavedList();
      setSaveOpen(false);
      toast.success("Design saved.");
    } finally {
      setSaving(false);
    }
  }

  function restore(design: SavedDesign) {
    const snapshot = design.snapshot;
    s.patch({
      productId: snapshot.productId,
      sport: snapshot.sport,
      garmentType: snapshot.garmentType,
      activePiece: snapshot.activePiece,
      prompt: snapshot.prompt,
      teamName: snapshot.teamName,
      colors: snapshot.colors,
      colorsEnabled: snapshot.colorsEnabled,
      artwork: { front: snapshot.artwork.front, back: snapshot.artwork.back },
      history: Array.isArray(snapshot.history) ? snapshot.history : [],
      roster: Array.isArray(snapshot.roster) ? snapshot.roster : [],
      customer: snapshot.customer,
      designId: snapshot.designId,
      selectedConceptId: snapshot.selectedConceptId,
      concepts: Array.isArray(snapshot.concepts) ? snapshot.concepts : [],
      activeStep: 4,
    });
    setSavedOpen(false);
    toast.success("Design loaded.");
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {/* Share + Save actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="min-h-10 rounded-xl"
          isDisabled={!canShare}
          onPress={() => void handleShare()}
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Link2 className="size-3.5" />}
          {copied ? "Copied" : "Share link"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="min-h-10 rounded-xl"
          isDisabled={!canSave}
          onPress={() => {
            initialName.current = useDesignerStore.getState().teamName || "My besu design";
            setDesignName(initialName.current);
            setSaveOpen(true);
          }}
        >
          <Bookmark className="size-3.5" />
          Save design
        </Button>
      </div>

      {/* Saved designs drawer */}
      {savedList.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            refreshSavedList();
            setSavedOpen((open) => !open);
          }}
          className="flex min-h-10 items-center justify-between gap-2 rounded-xl px-3 text-[11px] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
        >
          <span>Saved designs ({savedList.length})</span>
          <span className={cn("text-muted transition-transform", savedOpen && "rotate-180")}>▾</span>
        </button>
      ) : null}

      {savedOpen && savedList.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {savedList.map((design) => (
            <div
              key={design.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-black/[0.025] px-3 py-2"
            >
              <button
                type="button"
                onClick={() => restore(design)}
                className="min-w-0 flex-1 text-left focus-visible:outline-none"
              >
                <span className="block truncate text-[11px] font-semibold">{design.name}</span>
                <span className="block text-[10px] tabular-nums text-muted">
                  {new Date(design.savedAt).toLocaleDateString()} · {design.snapshot.sport} {design.snapshot.garmentType}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Delete ${design.name}`}
                onClick={() => {
                  deleteSavedDesign(design.id);
                  refreshSavedList();
                }}
                className="min-h-8 rounded-md px-1.5 text-muted hover:text-foreground"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <Modal>
        <Modal.Backdrop isOpen={saveOpen} onOpenChange={setSaveOpen}>
          <Modal.Container>
            <Modal.Dialog className="max-md:mx-3 max-md:w-[calc(100%-1.5rem)] sm:max-w-[340px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="font-semibold">Save this design</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="gap-3">
                <TextField fullWidth value={designName} onChange={setDesignName}>
                  <Label>Design name</Label>
                  <Input maxLength={40} autoFocus />
                </TextField>
              </Modal.Body>
              <Modal.Footer className="gap-2">
                <Button variant="ghost" slot="close" className="min-h-10">Cancel</Button>
                <Button className="min-h-10" isDisabled={saving} onPress={handleSave}>
                  {saving ? <Spinner size="sm" /> : "Save"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

function boostable(s: {
  artwork: Partial<Record<"front" | "back", string>>;
  selectedConceptId?: string;
  designId?: string;
}): boolean {
  return Boolean(
    s.artwork.front ||
      s.artwork.back ||
      s.selectedConceptId ||
      s.designId,
  );
}
