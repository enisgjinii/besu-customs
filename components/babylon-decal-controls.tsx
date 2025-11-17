"use client";

import { useEffect } from "react";
import {
  Scene,
  AbstractMesh,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  ActionManager,
  ExecuteCodeAction,
} from "@babylonjs/core";
import { useConfiguratorStore } from "@/lib/store";
import { toast } from "sonner";

interface BabylonDecalControlsProps {
  scene: Scene;
  rootMesh: AbstractMesh;
}

export function BabylonDecalControls({
  scene,
  rootMesh,
}: BabylonDecalControlsProps) {
  const selectedDecalId = useConfiguratorStore((s) => s.selectedDecalId);
  const decals = useConfiguratorStore((s) => s.decals);
  const updateDecal = useConfiguratorStore((s) => s.updateDecal);
  const removeDecal = useConfiguratorStore((s) => s.removeDecal);
  const setSelectedDecal = useConfiguratorStore((s) => s.setSelectedDecal);

  const selectedDecal = decals.find((d) => d.id === selectedDecalId);

  useEffect(() => {
    if (!scene || !rootMesh || !selectedDecalId || !selectedDecal) {
      // Clean up old controls
      const oldControls = scene.meshes.filter((m) =>
        m.name.startsWith("decalControl_")
      );
      oldControls.forEach((c) => c.dispose());
      return;
    }

    // Find the selected decal mesh
    const decalMesh = scene.meshes.find(
      (m) => m.name === `decal_${selectedDecalId}`
    );
    if (!decalMesh) return;

    // Get decal position and normal
    const decalPos = decalMesh.getBoundingInfo().boundingSphere.centerWorld;
    const decalSize = decalMesh.getBoundingInfo().boundingSphere.radiusWorld;

    // Clean up old controls
    const oldControls = scene.meshes.filter((m) =>
      m.name.startsWith("decalControl_")
    );
    oldControls.forEach((c) => c.dispose());

    const controlSize = 0.15;
    const offset = decalSize * 1.5;

    // Create material for control buttons
    const createControlMaterial = (color: string) => {
      const mat = new StandardMaterial(`controlMat_${color}`, scene);
      mat.diffuseColor = Color3.FromHexString(color);
      mat.emissiveColor = Color3.FromHexString(color).scale(0.5);
      mat.specularColor = new Color3(0.2, 0.2, 0.2);
      return mat;
    };

    // Rotate Left Control (Top-Left)
    const rotateLeftBtn = MeshBuilder.CreateSphere(
      "decalControl_rotateLeft",
      { diameter: controlSize },
      scene
    );
    rotateLeftBtn.position = new Vector3(
      decalPos.x - offset,
      decalPos.y + offset,
      decalPos.z
    );
    rotateLeftBtn.material = createControlMaterial("#60a5fa");
    rotateLeftBtn.isPickable = true;
    rotateLeftBtn.actionManager = new ActionManager(scene);
    rotateLeftBtn.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        const currentZ = selectedDecal.rotation?.z || 0;
        updateDecal(selectedDecalId, {
          rotation: { ...selectedDecal.rotation, z: currentZ - Math.PI / 12 },
        });
        toast.success("Rotated", { description: "-15°", duration: 1000 });
      })
    );

    // Rotate Right Control (Top-Right)
    const rotateRightBtn = MeshBuilder.CreateSphere(
      "decalControl_rotateRight",
      { diameter: controlSize },
      scene
    );
    rotateRightBtn.position = new Vector3(
      decalPos.x + offset,
      decalPos.y + offset,
      decalPos.z
    );
    rotateRightBtn.material = createControlMaterial("#60a5fa");
    rotateRightBtn.isPickable = true;
    rotateRightBtn.actionManager = new ActionManager(scene);
    rotateRightBtn.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        const currentZ = selectedDecal.rotation?.z || 0;
        updateDecal(selectedDecalId, {
          rotation: { ...selectedDecal.rotation, z: currentZ + Math.PI / 12 },
        });
        toast.success("Rotated", { description: "+15°", duration: 1000 });
      })
    );

    // Scale Up Control (Right)
    const scaleUpBtn = MeshBuilder.CreateSphere(
      "decalControl_scaleUp",
      { diameter: controlSize },
      scene
    );
    scaleUpBtn.position = new Vector3(
      decalPos.x + offset * 1.2,
      decalPos.y,
      decalPos.z
    );
    scaleUpBtn.material = createControlMaterial("#22c55e");
    scaleUpBtn.isPickable = true;
    scaleUpBtn.actionManager = new ActionManager(scene);
    scaleUpBtn.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        const newScale = {
          x: Math.max(0.1, selectedDecal.scale.x * 1.1),
          y: Math.max(0.1, selectedDecal.scale.y * 1.1),
          z: selectedDecal.scale.z,
        };
        updateDecal(selectedDecalId, { scale: newScale });
        toast.success("Scaled", { description: "+10%", duration: 1000 });
      })
    );

    // Scale Down Control (Left)
    const scaleDownBtn = MeshBuilder.CreateSphere(
      "decalControl_scaleDown",
      { diameter: controlSize },
      scene
    );
    scaleDownBtn.position = new Vector3(
      decalPos.x - offset * 1.2,
      decalPos.y,
      decalPos.z
    );
    scaleDownBtn.material = createControlMaterial("#22c55e");
    scaleDownBtn.isPickable = true;
    scaleDownBtn.actionManager = new ActionManager(scene);
    scaleDownBtn.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        const newScale = {
          x: Math.max(0.1, selectedDecal.scale.x * 0.9),
          y: Math.max(0.1, selectedDecal.scale.y * 0.9),
          z: selectedDecal.scale.z,
        };
        updateDecal(selectedDecalId, { scale: newScale });
        toast.success("Scaled", { description: "-10%", duration: 1000 });
      })
    );

    // Delete Control (Bottom)
    const deleteBtn = MeshBuilder.CreateSphere(
      "decalControl_delete",
      { diameter: controlSize * 1.2 },
      scene
    );
    deleteBtn.position = new Vector3(
      decalPos.x,
      decalPos.y - offset * 1.2,
      decalPos.z
    );
    deleteBtn.material = createControlMaterial("#ef4444");
    deleteBtn.isPickable = true;
    deleteBtn.actionManager = new ActionManager(scene);
    deleteBtn.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        removeDecal(selectedDecalId);
        toast.success("Deleted", { description: "Decal removed", duration: 1000 });
      })
    );

    // Close/Deselect Control (Center)
    const closeBtn = MeshBuilder.CreateSphere(
      "decalControl_close",
      { diameter: controlSize * 0.8 },
      scene
    );
    closeBtn.position = decalPos.clone();
    closeBtn.material = createControlMaterial("#6b7280");
    closeBtn.isPickable = true;
    closeBtn.actionManager = new ActionManager(scene);
    closeBtn.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        setSelectedDecal(null);
      })
    );

    // Make controls always face camera
    const controls = [
      rotateLeftBtn,
      rotateRightBtn,
      scaleUpBtn,
      scaleDownBtn,
      deleteBtn,
      closeBtn,
    ];

    scene.registerBeforeRender(() => {
      const camera = scene.activeCamera;
      if (camera) {
        controls.forEach((control) => {
          control.lookAt(camera.position);
        });
      }
    });

    // Cleanup
    return () => {
      const controlsToClean = scene.meshes.filter((m) =>
        m.name.startsWith("decalControl_")
      );
      controlsToClean.forEach((c) => c.dispose());
    };
  }, [
    scene,
    rootMesh,
    selectedDecalId,
    selectedDecal,
    updateDecal,
    removeDecal,
    setSelectedDecal,
  ]);

  return null;
}
