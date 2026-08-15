# Plan: Adaptive Crawler & Incremental Update Improvements

The goal is to adjust the crawler settings so that it can be run incrementally (only updating missing or changed parts) without starting from scratch, and to refine theme/footer extraction for better accuracy.

## User Improvements
- Added "Incremental Crawl" option in the Admin Banks UI.
- Improved crawler logic to prioritize specific brand elements.
- Optimized database updates to avoid unnecessary overwrites of manual corrections.

## Technical Details

### 1. Database Schema Extensions (Internal)
- Add `last_crawled_at` and `crawl_version` to the `banks` table to track when and how a bank was last processed.

### 2. UI Updates (`src/routes/_authenticated/admin/banks.tsx`)
- Add a new crawl mode: **"Incremental"**.
- This mode will only process banks where `online_banking_url` is present but `footer_last_checked_at` is older than a certain threshold or null.
- Add specific checkboxes for what to re-crawl: [x] Logos, [x] Footer, [x] Theme/Colors, [x] Footer Pages.

### 3. Crawler Logic Refinement (`src/lib/logo-crawler.functions.ts`)
- Update `crawlBankLogos` to accept specific "scopes" (what to crawl).
- Implement a check to skip parts that already exist if the user selects "incremental".
- Improve `pickHeaderLogo` to be more resilient against "lazy-loaded" logos common in modern bank portals.
- Refine `extractTheme` to better detect high-contrast brand colors over generic UI colors.

### 4. Theme Derivation (`src/lib/deriveTheme.ts`)
- Ensure `radiusFromCss` handles more complex shorthand CSS properties (e.g., `4px 4px 0 0`).

## Proposed Implementation Steps

1. **Step 1: DB Migration** - Add `last_crawled_at` to `banks`.
2. **Step 2: Backend Logic** - Update `crawlBankLogos` to support selective crawling (scopes).
3. **Step 3: UI Integration** - Update the Admin dashboard with the new "Incremental" options and scope selection.
4. **Step 4: Refinement** - Improve extraction regexes for logos and buttons based on recent project feedback.
