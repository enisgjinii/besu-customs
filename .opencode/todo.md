# Mission: iOS 26 Liquid Glass Redesign with Bottom-Nav-Only UI

## M1: Liquid Glass Design System | status: completed
### T1.1: Global glass materials + ambient backdrop | agent:Worker
- [x] S1.1.1: Add liquid glass CSS system to app/globals.css (glass materials, specular highlights, spring animations) | size:M | evidence: globals.css `--- iOS 26 LIQUID GLASS DESIGN SYSTEM ---` section, build pass
- [x] S1.1.2: Add animated aurora ambient backdrop + segmented control + icon button + sheet/scrim utilities | size:M | evidence: `.liquid-ambient`, `.liquid-segmented`, `.liquid-icon-btn`, `.liquid-scrim` classes present

### T1.2: iOS 26 MUI theme | agent:Worker
- [x] S1.2.1: Rewrite components/designer/designer-theme.ts (glass papers, pill buttons, segmented toggles, iOS sliders/inputs) | size:M | evidence: tsc --noEmit clean, eslint clean

## M2: Bottom-Nav-Only Shell | status: completed
### T2.1: Rewrite designer-page.tsx shell | agent:Worker
- [x] S2.1.1: Remove AppBar/Drawer/fixed sidebar; full-bleed canvas stage over ambient backdrop | size:M | evidence: designer-page.tsx LiquidShell, build pass
- [x] S2.1.2: Floating glass bottom nav bar (Design/Place/Roster/Order + reset) with badges, active bubble, safe-area | size:M | evidence: nav `liquid-nav-enter`, Badge counts wired to store
- [x] S2.1.3: Compact glass sheets above nav with swipe-to-dismiss, scrim, spring animations, reset dialog | size:M | evidence: pointer-drag handlers + `liquid-sheet-enter/exit`

### T2.2: Full-bleed garment canvas | agent:Worker
- [x] S2.2.1: Rewrite garment-canvas.tsx: floating glass header pill, segmented Front/Back, glass hint + icon buttons | size:M | evidence: garment-canvas.tsx rewritten, build pass

## M3: Verification | status: completed
### T3.1: Full system verification | agent:Reviewer
- [x] S3.1.1: TypeScript check passes (npx tsc --noEmit) | size:S | evidence: clean, 0 errors
- [x] S3.1.2: ESLint passes (pnpm lint, --max-warnings=0) | size:S | evidence: clean, 0 warnings
- [x] S3.1.3: Production build passes (pnpm build) | size:M | evidence: "Compiled successfully", 41/41 pages generated
