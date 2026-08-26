---
name: Cyan Modernity
colors:
  surface: '#ecfcff'
  surface-dim: '#c6dfe2'
  surface-bright: '#ecfcff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#dff8fc'
  surface-container: '#daf2f6'
  surface-container-high: '#d4edf1'
  surface-container-highest: '#cee7eb'
  on-surface: '#071f22'
  on-surface-variant: '#3c494a'
  inverse-surface: '#1d3437'
  inverse-on-surface: '#dcf5f9'
  outline: '#6c7a7b'
  outline-variant: '#bbc9ca'
  surface-tint: '#006970'
  primary: '#006970'
  on-primary: '#ffffff'
  primary-container: '#50e8f4'
  on-primary-container: '#00666c'
  inverse-primary: '#3bdae6'
  secondary: '#4b6266'
  on-secondary: '#ffffff'
  secondary-container: '#cee7eb'
  on-secondary-container: '#51686c'
  tertiary: '#36656b'
  on-tertiary: '#ffffff'
  tertiary-container: '#addde3'
  on-tertiary-container: '#336368'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7af4ff'
  primary-fixed-dim: '#3bdae6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#cee7eb'
  secondary-fixed-dim: '#b2cbcf'
  on-secondary-fixed: '#071f22'
  on-secondary-fixed-variant: '#344a4e'
  tertiary-fixed: '#baebf1'
  tertiary-fixed-dim: '#9fcfd5'
  on-tertiary-fixed: '#002023'
  on-tertiary-fixed-variant: '#1c4d53'
  background: '#ecfcff'
  on-background: '#071f22'
  surface-variant: '#cee7eb'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 260px
  container-padding: 2rem
  gutter-md: 1.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

This design system is built for a precision-focused fintech environment where clarity and data density are paramount. The brand personality is **Corporate Modern**, blending the reliability of traditional finance with the high-tech energy of crypto and FX markets. 

The aesthetic is defined by **High-Contrast Digitalism**: deep obsidian tones paired with vibrant, electrified cyan. The interface uses a systematic approach to information hierarchy, ensuring that complex calculations remain legible. It evokes a sense of "technological authority"—it is fast, accurate, and professional. The visual style utilizes clear structural boundaries, subtle depth through elevation, and a focused color palette to minimize cognitive load during high-stakes financial monitoring.

## Colors

The palette is a dual-mode system designed for extreme legibility and brand recognition. 

- **Primary (Accent):** #50e8f4 is used exclusively for interactive elements, primary call-to-actions, and active navigation states. It acts as a "highlighter" for critical information.
- **Secondary (Obsidian):** #001619 serves as the heavy anchor for the sidebar and text elements, providing a grounded, professional contrast.
- **Tertiary (Oxygen):** #c7f8fe is the canvas. It provides a soft, tech-influenced light background that reduces eye strain compared to pure white.

Use semantic coloring for data: while cyan is the primary brand color, use standard green/red for market trends only when strictly necessary, otherwise lean on the primary accent to maintain the unique brand identity.

## Typography

The design system utilizes **Inter** for its exceptional legibility in data-heavy interfaces. The typographic hierarchy is strictly enforced to guide the user through complex financial figures.

- **Display & Headlines:** Used for "big numbers" like current exchange rates. Bold weights and tight letter-spacing emphasize the importance of the data.
- **Body Text:** Optimized for readability in list views and calculation details.
- **Labels:** Small, uppercase, and slightly tracked-out (letter-spaced) to differentiate from active data.
- **Numeric Data:** While Inter is used, tabular lining figures should be enabled via CSS (`font-variant-numeric: lining-nums tabular-nums`) to ensure price columns align perfectly.

## Layout & Spacing

This design system uses a **Fixed Sidebar / Fluid Content** model. 

1.  **Sidebar:** A fixed 260px width sidebar on the left, utilizing the #001619 background.
2.  **Main Content Area:** A fluid container that expands with the viewport but maintains a maximum readable width of 1440px for dashboard widgets.
3.  **Grid:** A 12-column grid system is used for dashboard layouts. On desktop, cards typically span 4, 6, or 8 columns.
4.  **Responsive Tiers:** 
    - **Desktop (>1024px):** Full sidebar and multi-column grid.
    - **Tablet (768px - 1023px):** Sidebar collapses to icons only (64px), grid shifts to 2-column stacks.
    - **Mobile (<767px):** Sidebar becomes a bottom navigation bar or hidden drawer, content flows in a single column with reduced (1rem) side margins.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Precision Outlines** rather than heavy shadows.

- **Level 0 (Main BG):** The base layer #c7f8fe.
- **Level 1 (Cards):** Surfaces use a slightly lighter version of the background or white with a very fine 1px border (#001619 at 10% opacity).
- **Shadows:** Only used on active cards or floating modals. Use a "Fintech Shadow": `0 10px 15px -3px rgba(0, 22, 25, 0.05), 0 4px 6px -2px rgba(0, 22, 25, 0.02)`. This keeps the UI feeling light and airy.
- **Interactive Depth:** On hover, cards may lift slightly (increase shadow) or gain a primary-colored border.

## Shapes

The design system uses a **Rounded** shape language to soften the high-contrast professional aesthetic.

- **Base Components:** 0.5rem (8px) for buttons, input fields, and small cards.
- **Containers:** 1rem (16px) for main dashboard widgets and large content sections.
- **Interactive States:** Active navigation markers in the sidebar use a 0.25rem rounded edge on the inner side or a pill-shaped indicator.
- **Icons:** Use a consistent stroke-based icon set with slightly rounded terminals to match the font geometry.

## Components

- **Buttons:** 
  - *Primary:* Solid #50e8f4 with #001619 text. Heavy 600 weight.
  - *Secondary:* Transparent with 2px stroke of #001619.
- **Sidebar Nav:** High-contrast items. Active state uses a #50e8f4 glow or left-accent bar. Icons should be 20px and centered in a 40px hit area.
- **Data Cards:** Cards should have a clear header with a `label-md` title. Content inside should be separated by thin dividers (#001619 at 5% opacity).
- **Input Fields:** Search bars and text inputs use a light background (white or #dcfbff) with a #001619 border that turns #50e8f4 on focus.
- **Chips/Badges:** Used for status (e.g., "available"). Small, compact, and utilizing the secondary color background with primary text for high visibility.
- **Value Displays:** Large rate displays (e.g., currency prices) should use the `display-lg` typography in the primary accent color to make them the focal point of the page.