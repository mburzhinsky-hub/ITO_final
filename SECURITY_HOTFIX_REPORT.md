# Stage 9 Security Hotfix Report

## Scope
Security hotfix for VIZHU AV presales calculator focused on XSS / HTML injection, unsafe JSON import, standalone HTML proposal export, and Excel formula injection.

## Main risks found
- `innerHTML` is still used as the main page rendering mechanism. This is acceptable only when dynamic values are escaped before entering template strings.
- Several rendered entities were previously interpolated directly into HTML templates: project cards, zone cards, estimate tables, grouped estimate rows, warning cards, equipment/library cards, proposal guard messages and supplier panels.
- Imported JSON was trusted too early: malicious text could be normalized into project fields and later rendered.
- Excel XML export escaped XML characters but did not protect spreadsheet cells beginning with `=`, `+`, `-`, or `@`.
- Existing `escapeHtml` did not escape single quotes or backticks.

## Security utilities added
Created `/src/utils/sanitize.js` with:
- `escapeHtml(value)` for `& < > " ' \``.
- `escapeAttr(value)` for safe attribute values.
- `safeText(value, fallback)`.
- `safeNumber(value, fallback)`.
- `safeUrl(value)` blocking `javascript:`, `data:text/html`, `vbscript:` and unsafe protocols.
- `stripHtml(value)`.
- `trimText(value, maxLength)`.
- `sanitizeImportedProject(data)` for imported JSON normalization and HTML stripping in critical project fields.
- `escapeSpreadsheetCell(value)` for Excel formula injection protection.
- `hasSuspiciousMarkup(value)` for import warning detection.

`/src/utils/format.js` now re-exports the security helpers so existing imports keep working.

## Rendering fixes
Escaped user-controlled or supplier-controlled data in:
- Project cards: project name, customer name, ids in data attributes.
- Passport form: project/customer fields and option values.
- Zone cards and zone template page: zone names, types, tasks, reasons, ids, categories, template search input.
- Estimate tables: item names, categories, units, notes, source labels, zone names and ids.
- Warning cards/lists: warning title, message, entity type, action label and ids.
- Library cards/filters: equipment name, brand, model, supplier, category labels, supplier metadata, search inputs and filter option values.
- Proposal preview / standalone proposal HTML: already mostly escaped; covered by tests and kept as escaped-only output.
- Proposal guard messages: warning titles escaped before rendering.
- Router error/loading screens: route and error text escaped.

## Import JSON hardening
Updated `/src/export/exportJson.js`:
- schema version raised to `9`.
- app version raised to `stage9-security-hotfix`.
- import path now runs: `migrateProjectSchema` -> `sanitizeImportedProject` -> `validateImportedProject` / `normalizeProject`.
- suspicious markup detection returns a `sanitized` flag.
- import dialog shows: “Проект импортирован, потенциально опасная разметка была очищена”.

## HTML export hardening
Checked `/src/export/exportHtml.js` and `ProposalPreview`:
- proposal title and project/customer fields are escaped.
- standalone document body is generated from escaped proposal preview output.
- no user-provided scripts are inserted into standalone HTML.
- the only script left in standalone HTML is the static load-state helper.

## Excel / CSV export hardening
Updated `/src/export/exportExcel.js`:
- `escapeSpreadsheetCell` is applied to string cells in Excel XML.
- CSV export applies the same protection.
- numeric cells remain numbers so money/quantity columns continue working normally.

## Tests added
Added `/tests/security.test.js` covering:
- `escapeHtml`, `escapeAttr`, `safeUrl`, `stripHtml`, long-string trimming.
- malicious import for project name, customer, zone name and estimate item name.
- proposal preview escaping.
- standalone HTML proposal escaping.
- WarningList escaping.
- Library / supplier equipment card escaping.
- Excel formula injection prefixes: `=`, `+`, `-`, `@`.

Added `/tests/static-security-scan.js`:
- scans `/src` for critical unsafe patterns such as `document.write`, `insertAdjacentHTML`, `outerHTML`, inline event handlers and `href="javascript:`.
- scans render/export files for watchlist `innerHTML` / raw interpolation patterns.
- critical findings fail tests; watchlist findings are printed for review.

`package.json` already runs `node tests/run-tests.js` via `npm test`, so the new security tests and scan are included.

## Verification performed
- `node --check` passed for all JS files in `/src`.
- `npm test` passed.
- XSS payloads tested:
  - `<script>alert(1)</script>`
  - `<img src=x onerror=alert(1)>`
  - `"><svg onload=alert(1)>`
  - `<iframe srcdoc="<script>alert(1)</script>"></iframe>`
  - `javascript:alert(1)`
- Spreadsheet payloads tested:
  - `=HYPERLINK("http://evil.test","click")`
  - `+cmd|' /C calc'!A0`
  - `@SUM(1+1)`

## Notes
- `innerHTML` is not fully removed. It remains the app rendering model, but dynamic render paths now use escaping helpers.
- Static scan still prints watchlist warnings for known template-rendering locations; no critical unsafe pattern blocks the test run.
- Full browser click-through was not executed in this environment; the included automated tests simulate the relevant render/export/import payload paths.
