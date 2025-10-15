// Self-contained test that mirrors the hoodie mapping logic from lib/model-utils.ts
function applyBasketballJerseyNaming(sections, modelUrl) {
  let updatedSections = [...sections];
  const modelId = (modelUrl || '').toLowerCase();
  const isShootingShirtByUrl = modelId.includes('basketball shooting shirt');
  const isShootingShirtHoodieByUrl = modelId.includes('basketball shooting shirt') && modelId.includes('hoodie');
  const containsHoodKeywords = sections.some((section) => {
    const on = (section.originalName || '').toLowerCase();
    const dn = (section.name || '').toLowerCase();
    return on.includes('hood') || dn.includes('hood') || on.includes('hoodie') || dn.includes('hoodie');
  });
  const isShootingShirtHoodie = isShootingShirtHoodieByUrl || containsHoodKeywords;

  if (isShootingShirtHoodie) {
    const filteredSections = updatedSections.filter((section) => {
      const originalName = (section.originalName || '').toLowerCase();
      const displayName = (section.name || '').toLowerCase();
      if (originalName.includes('cord end') || displayName.includes('cord end')) {
        return false;
      }
      return true;
    });
    updatedSections = filteredSections;

    let xMaterialCount = 0;
    updatedSections.forEach((section) => {
      const originalName = (section.originalName || '').toLowerCase();
      const displayName = (section.name || '').toLowerCase();
      if (originalName.includes('zipper tape fabric') || displayName.includes('zipper tape')) {
        section.name = 'Zipper Outline';
      } else if (originalName.includes('zipper teeth') || originalName.includes('zipper_teeth') || displayName === 'zipper teeth') {
        section.name = 'Zipper Teeth Color';
      } else {
        // Detect 'X' materials with common exporter variants such as
        // 'X', 'x', 'X (1)', 'x_1', 'x(2)' etc. We check both the
        // original name and the current display name (lowercased above).
        const isXVariant =
          originalName === 'x' ||
          originalName.startsWith('x ') ||
          originalName.startsWith('x(') ||
          originalName.startsWith('x_') ||
          displayName === 'x' ||
          displayName.startsWith('x ') ||
          displayName.startsWith('x(') ||
          displayName.startsWith('x_');

        if (isXVariant) {
          xMaterialCount++;
          if (xMaterialCount === 1) {
            section.name = 'Collar & Top of Hoodie Stitching Color';
          } else {
            section.name = 'Hoodie Face Stitching Color';
          }
        }
      }
      section.category = 'Basketball Shooting Shirt with Hoodie';
    });

    const topStopperSections = updatedSections.filter(s => {
      const on = (s.originalName || '').toLowerCase();
      const dn = (s.name || '').toLowerCase();
      return on.includes('zipper top stopper') || on.includes('zipper_top_stopper') ||
             dn.includes('zipper topstopper') || dn.includes('zipper top stopper') ||
             dn.includes('topstopper') || dn.includes('top stopper');
    });
    if (topStopperSections.length > 1) {
      const combinedSection = topStopperSections[0];
      combinedSection.name = 'Zipper Top Stopper';
      updatedSections = updatedSections.filter(s => !topStopperSections.includes(s) || s === combinedSection);
    } else if (topStopperSections.length === 1) {
      topStopperSections[0].name = 'Zipper Top Stopper';
    }

    const bottomStopperSections = updatedSections.filter(s => {
      const on = (s.originalName || '').toLowerCase();
      const dn = (s.name || '').toLowerCase();
      return on.includes('zipper bottom stopper') || on.includes('zipper_bottom_stopper') ||
             dn.includes('zipper bottomstopper') || dn.includes('zipper bottom stopper') ||
             dn.includes('bottomstopper') || dn.includes('bottom stopper');
    });
    if (bottomStopperSections.length > 1) {
      const combinedSection = bottomStopperSections[0];
      combinedSection.name = 'Zipper Bottom Stopper';
      updatedSections = updatedSections.filter(s => !bottomStopperSections.includes(s) || s === combinedSection);
    } else if (bottomStopperSections.length === 1) {
      bottomStopperSections[0].name = 'Zipper Bottom Stopper';
    }
  }

  return updatedSections;
}

const sections = [
  { id: 'a', name: 'Fabric', originalName: 'FABRIC', category: 'Other', color: '#ffffff' },
  { id: 'b', name: 'Fabric', originalName: 'FABRIC2', category: 'Other', color: '#ffffff' },
  { id: 'c', name: 'Cord End', originalName: 'CORD END', category: 'Other', color: '#000000' },
  { id: 'd', name: 'Cord End', originalName: 'CORD END 2', category: 'Other', color: '#000000' },
  { id: 'e', name: 'Zipper Teeth', originalName: 'zipper_teeth', category: 'Other', color: '#000000' },
  { id: 'e2', name: 'Zipper Tape Fabric', originalName: 'zipper tape fabric', category: 'Other', color: '#000000' },
  { id: 'e3', name: 'Zipper_Tape', originalName: 'zipper_tape', category: 'Other', color: '#000000' },
  { id: 'f', name: 'X (1)', originalName: 'X (1)', category: 'Other', color: '#000000' },
  { id: 'g', name: 'X (2)', originalName: 'X (2)', category: 'Other', color: '#000000' },
  { id: 'h', name: 'Zipper Slider', originalName: 'zipper slider', category: 'Other', color: '#000000' },
  { id: 'i', name: 'Zipper Puller', originalName: 'zipper puller', category: 'Other', color: '#000000' },
  { id: 'j', name: 'Zipper TopStopper', originalName: 'zipper top stopper 1', category: 'Other', color: '#000000' },
  { id: 'k', name: 'Zipper TopStopper', originalName: 'zipper top stopper 2', category: 'Other', color: '#000000' },
  { id: 'l', name: 'Zipper BottomStopper', originalName: 'zipper bottom stopper 1', category: 'Other', color: '#000000' },
  { id: 'm', name: 'Zipper BottomStopper', originalName: 'zipper bottom stopper 2', category: 'Other', color: '#000000' },
];

const result = applyBasketballJerseyNaming(sections, 'basketball shooting shirt with hoodie.glb');
console.log(JSON.stringify(result.map(s => ({originalName: s.originalName, name: s.name, category: s.category})), null, 2));
