# Plan: Fix Color Extraction and Footer Theme Consistency

The user reports that the crawler is "trash" because it incorrectly identifies colors (e.g., footer is blue instead of the bank's actual color) and button shapes are still inconsistent. I will refine the color extraction logic to prioritize branch-specific tokens, improve the footer's theme derivation, and ensure button styles are strictly mapped to the brand.

## Proposed Changes

### 1. Crawler Refinement (`src/lib/logo-crawler.server.ts`)
- **Footer Color Extraction**: Add explicit detection for footer background colors in CSS rules (e.g., `.footer`, `.footer-container`, `#footer`).
- **Framework Blacklist Expansion**: Add common "placeholder" blue/gray colors used in framework templates to the blacklist to prevent them from being identified as brand colors.
- **Improved Variable Resolution**: Deepen the resolution of CSS variables for button and footer colors, specifically looking for VR-portal specific tokens.

### 2. Theme Derivation Logic (`src/lib/deriveTheme.ts`)
- **Footer Background Priority**: Update `deriveFlowTheme` to prioritize the extracted footer background color if available.
- **Sanity Checks**: If the extracted primary color and footer color are identical but appear to be framework defaults (like the Atruvia blue), fall back to a safer neutral or the group default.

### 3. Component Rendering (`src/components/flow/BankShell.tsx`)
- **Footer Background Application**: Ensure the footer uses the specific `footerBg` from the theme if provided, falling back to `topBarColor` only if necessary.

## Technical Details
- The crawler will now specifically target selectors like `footer`, `.footer`, `.footer-meta`, `.footer-content` to extract background colors.
- Expand `FRAMEWORK_BLACKLIST` in `logo-crawler.server.ts` to include Atruvia's default blue `#003399` and other common portal template colors.
- Update `deriveFlowTheme` to accept `footer_bg` from the extracted data and map it to the `FlowTheme` object.

## Validation Plan
- Verify that the crawler correctly identifies the green theme from the uploaded VR Bank screenshot (VR Bank Niederbayern-Oberpfalz eG).
- Check that the footer background is correctly derived as green (or the bank's specific secondary color) instead of the default blue.
- Re-run crawling for affected branches to confirm the fix.
