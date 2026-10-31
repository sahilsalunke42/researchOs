---
name: ResearchOS
description: Autonomous literature review and scientific research gap identification workbench
colors:
  bg-base: "#FAFAFA"
  bg-surface: "#FFFFFF"
  bg-subtle: "#F4F4F5"
  border: "#E4E4E7"
  text-primary: "#09090B"
  text-muted: "#71717A"
  accent: "#2563EB"
  accent-green: "#16A34A"
  accent-amber: "#D97706"
  accent-red: "#DC2626"
typography:
  display:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.015em"
  title:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "var(--font-jetbrains-mono), monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0.02em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "#1D4ED8"
  button-secondary:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  input-base:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: ResearchOS

## Overview

**Creative North Star: "Swiss Precision Laboratory"**

ResearchOS is an instrument for scientific inquiry, literature synthesis, and hypothesis validation. Its interface rejects generic SaaS aesthetics—banning decorative gradients, floating drop shadows, ungrounded cards, and marketing kickers—in favor of high-density typography, strict 1px hairlines, and unambiguous epistemic provenance.

The visual language treats scientific research as an empirical discipline. Every claim, gap candidate, and matrix comparison is explicitly grounded against literature evidence or clearly marked as candidate conjecture. Data tables, metrics, and progress indicators are rendered with disciplined tabular numerals, allowing researchers to scan hundreds of papers and comparison dimensions with zero visual noise.

Light and dark modes are engineered as twin laboratory benches. Light mode is calibrated like fresh archival paper with dark charcoal typography, while dark mode provides a low-emission obsidian terminal with disciplined high-contrast legibility.

**Key Characteristics:**
- High-density information architecture with disciplined spatial rhythm.
- 1px hairline dividers separating logical sections rather than heavy elevation cards.
- Tabular numerals across all dates, paper counters, and metrics.
- Semantic status telemetry (Cobalt, Emerald, Amber, Crimson) dedicated solely to evidence certainty.
- First-class keyboard navigation featuring an omnipresent Command Palette (`⌘K`).

## Colors

The ResearchOS palette is an austere, utilitarian spectrum anchored in neutral paper tones and punctuated exclusively by functional telemetry.

### Primary
- **Cobalt Accent** (`#2563EB` / `hsl(217 91% 60%)`): Used for primary interactive triggers, active tab selections, ongoing pipeline execution, and focus states. Never used decoratively.

### Secondary
- **Corroborated Emerald** (`#16A34A` / `hsl(142 76% 36%)`): Confirmed findings, validated gaps, fully indexed papers, and successful pipeline completions.
- **Preliminary Amber** (`#D97706` / `hsl(32 95% 44%)`): Hypotheses requiring validation, partial extractions, pipeline queue states, and exploratory gaps.
- **Refuted Crimson** (`#DC2626` / `hsl(0 84% 51%)`): Contradicted claims, extraction failures, refuted gaps, and system errors.

### Neutral
- **Base Canvas** (`#FAFAFA` light, `#0A0A0A` dark): Foundational backdrop for all viewports.
- **Surface Layer** (`#FFFFFF` light, `#121212` dark): Elevated operational ground for tables, ledgers, and dialogs.
- **Subtle Fill** (`#F4F4F5` light, `#1A1A1A` dark): Background for hover states, code chips, and input fields.
- **Hairline Border** (`#E4E4E7` light, `#262629` dark): 1px structural boundary dividing panels, rows, and headers.
- **Primary Ink** (`#09090B` light, `#FAFAFA` dark): High-contrast text for headers, titles, and primary content.
- **Muted Ink** (`#71717A` light, `#A1A1AA` dark): Secondary text for metadata, timestamps, and paper author attributions.

### Named Rules
**The Strict Telemetry Rule.** Color never serves as decorative flourish. Hues are strictly reserved for epistemic certainty states: Cobalt for active execution, Emerald for empirical corroboration, Amber for preliminary hypotheses, and Crimson for contradictions or refuted claims.

**The High-Contrast Legibility Rule.** Foreground interactive states must strictly maintain ≥ 4.5:1 contrast against their rendered ground in both light and dark themes. Accent backgrounds must strictly pair with crisp white text.

## Typography

**Display Font:** Inter (`var(--font-inter)`, `system-ui`, `sans-serif`)
**Body Font:** Inter (`var(--font-inter)`, `system-ui`, `sans-serif`)
**Label/Mono Font:** JetBrains Mono (`var(--font-jetbrains-mono)`, `monospace`)

**Character:** Utilitarian, rigorous, and highly legible across dense scientific tables and technical prose.

### Hierarchy
- **Display** (600, 2rem / 32px, 1.25 line-height, -0.02em tracking): Platform page titles and landing section anchors.
- **Headline** (600, 1.5rem / 24px, 1.33 line-height, -0.015em tracking): Major workbench tab headings and workspace titles.
- **Title** (600, 1.125rem / 18px, 1.4 line-height, -0.01em tracking): Section subheadings, modal titles, and card headers.
- **Body** (400/500, 0.875rem / 14px, 1.5 line-height): Paper abstracts, synthesis narrative, and primary reading content (65–75ch optimal line length).
- **Label** (500, 0.75rem / 12px, 1.33 line-height, 0.02em tracking, monospace): DOIs, citation keys, status telemetry pills, and table headers.

### Named Rules
**The Tabular Precision Rule.** All quantitative metrics, dates, confidence scores, citation counts, and progress telemetry must use tabular numbers (`font-variant-numeric: tabular-nums`, `font-feature-settings: 'tnum'`).

**The Epistemic Citation Rule.** Academic citations, DOIs, ArXiv IDs, and code fragments are always styled in monospace typography with subtle border bounds to distinguish verified literature from narrative text.

## Layout

The spatial model organizes analytical tasks into an efficient instrument desk:
- **Instrument Header:** A fixed 48px top bar with minimal vertical footprint, containing breadcrumbs, real-time pipeline status, search trigger (`⌘K`), and theme toggle.
- **Utilitarian Rail:** A collapsible navigation sidebar (200px expanded, 56px collapsed) bounded by a 1px vertical hairline, with keyboard shortcut toggle (`⌘\`).
- **Workspace Canvas:** Max-width 1200px centered container with flexible grid lanes for high-density ledgers and side-by-side comparative matrices.
- **Spacing Grid:** 4px baseline rhythm (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).

## Elevation & Depth

ResearchOS follows a flat, structural elevation model. Deep drop shadows and atmospheric glows are banned. Depth is conveyed exclusively through discrete background tint steps and 1px hairline dividers.

### Shadow Vocabulary
- **Modal Overlay Surface:** `0 16px 32px rgba(0, 0, 0, 0.12)` (light), `0 16px 32px rgba(0, 0, 0, 0.4)` (dark). Used strictly on floating dialogs (Command Palette) to separate modal interaction from the workspace canvas.
- **Resting Canvas:** No drop shadow (`box-shadow: none`). Surfaces sit flush upon 1px hairlines.

### Named Rules
**The Flat-By-Default Rule.** All surfaces are flat at rest. Depth is expressed by tonal contrast steps (`bg-base` to `bg-surface` to `bg-subtle`) bounded by 1px hairlines. Atmospheric blurs and neon glows are forbidden.

## Shapes

Forms are disciplined, compact, and geometric:
- **Controls & Buttons:** 6px radius (`rounded-md`).
- **Cards & Ledger Containers:** 8px radius (`rounded-lg`) with 1px hairline border (`border border-border`).
- **Status Pills & Telemetry Chips:** 9999px pill radius (`rounded-full`).
- **Inputs & Fields:** 6px radius (`rounded-md`) with 1px hairline border.

## Components

### Buttons
- **Shape:** 6px radius (`rounded-md`), 8px 14px padding.
- **Primary:** Cobalt ground (`bg-accent`), crisp white text (`text-white`), bold-medium font weight.
- **Hover / Focus:** Darker cobalt hover (`hover:bg-blue-700`), 2px ring focus (`focus-visible:ring-2 focus-visible:ring-accent`).
- **Secondary / Ghost:** Surface or transparent ground with 1px border (`border border-border hover:bg-bg-subtle text-text-primary`).

### Chips / Status Badges
- **Style:** Compact pill (`rounded-full`), 2px 8px padding, 11px monospace typography (`text-[11px] font-mono`).
- **States:**
  - *Corroborated:* Emerald tint ground, emerald text, emerald icon (`CheckCircle2`).
  - *Preliminary:* Amber tint ground, amber text, amber icon (`AlertCircle`).
  - *Refuted / Error:* Red tint ground, red text, red icon (`XCircle`).
  - *Active:* Cobalt tint ground, cobalt text, cobalt spinner or dot.

### Cards / Containers
- **Corner Style:** 8px radius (`rounded-lg`).
- **Background:** `bg-bg-surface` with `bg-bg-subtle` headers.
- **Border:** 1px hairline (`border border-border`).
- **Internal Padding:** 16px (`p-4`) or 24px (`p-6`).

### Inputs / Fields
- **Style:** 1px hairline border (`border border-border`), `bg-bg-surface`, 6px radius (`rounded-md`), 8px 12px padding.
- **Focus:** 1px accent border shift with ring (`focus:border-accent focus:ring-1 focus:ring-accent`).

### Navigation
- **Sidebar Rail:** Vertical list with 13px typography, subtle icon alignment, clean active background tint (`bg-accent/10 text-accent font-medium`).
- **Workbench Tabs:** Horizontal instrument tabs with active bottom indicator hairline or pill highlight.

### Command Palette
- **Signature Component:** Center-anchored floating modal invoked via `⌘K` or search trigger. Instant keyboard-driven navigation across projects, workbench tabs, and recent literature queries.

## Do's and Don'ts

### Do:
- **Do** format all numerical data, paper counters, dates, and confidence intervals with tabular numerals (`tabular-nums`).
- **Do** anchor every gap candidate and claim to an explicit literature citation with DOI/ArXiv traceback.
- **Do** keep instrument bars and headers compact (48px) with functional utilities (`⌘K` command palette, theme switcher).
- **Do** ensure active filter chips and accent buttons use high-contrast text (`#FFFFFF` on cobalt).
- **Do** use 1px hairlines (`border border-border`) for separation instead of heavy drop shadows.

### Don't:
- **Don't** add category eyebrows, section numbering prefixes (`01 /`), or kickers above section titles.
- **Don't** apply gradient text, neon atmospheric glows, or hard offset drop shadows.
- **Don't** use emoji characters as UI icons; use strict 16px Lucide outline icons.
- **Don't** simulate fake progress or mock completed literature analysis. Real backend states only.
- **Don't** use thick colored borders on card sides (`border-l-4`).
