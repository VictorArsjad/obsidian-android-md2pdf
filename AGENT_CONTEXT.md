# Agent handoff: obsidian-android-md2pdf

Last updated: 2026-09-30. Written for a successor agent continuing this work.

## One-line summary

Obsidian Android plugin that exports the active Markdown note to a **selectable text PDF** in the vault via a **modal** (no sidebar/preview). Repo: https://github.com/VictorArsjad/obsidian-android-md2pdf

## Paths

| What | Path |
| --- | --- |
| Local repo | `/Users/victor.arsjad/Projects/personal/obsidian-android-md2pdf` |
| Git remote | `git@github.com:VictorArsjad/obsidian-android-md2pdf.git` (`master`) |
| Vault | `/Users/victor.arsjad/obsidian/Everything` |
| Installed plugin | `.../Everything/.obsidian/plugins/obsidian-android-md2pdf/` |
| Plugin id | `obsidian-android-md2pdf` |
| Display name | `Android MD2PDF` |

**Note:** Cursor `move_agent_to_root` to this path was attempted and aborted in-session; user said renaming the local dir was optional. Repo on disk is already `obsidian-android-md2pdf`.

## Origin / motivation

1. Analyzed [ALE-ARME/markdown-to-pdf-mobile](https://github.com/ALE-ARME/markdown-to-pdf-mobile): Gemini-generated jsPDF line-parser + live preview sidebar; slow/freezes; weird spacing; image-heavy fonts.
2. User tried [dontloseyourheadsu/obsidian-android-pdf](https://github.com/dontloseyourheadsu/obsidian-android-pdf) (HTML → browser print). **Did not work** for them.
3. User asked to rebuild properly: no themes, no sidebar, modal on command, match desktop Export-to-PDF spacing as closely as possible, Android-focused.

## Locked product decisions

- **Delivery:** write `.pdf` into the vault (not Chrome/system print).
- **UI:** command + ribbon → `ExportModal` (Export / Cancel). No live preview.
- **Theme:** light pages only.
- **Save path default:** beside the note (`Note.md` → `Note.pdf` same folder).
- **Settings persisted** via `loadData` / `saveData`:
  - `exportFolder` (empty = beside note)
  - `openAfterExport` (default true)
  - `overwriteExisting` (default true — silent overwrite)
- **Platform:** Android-first (`isDesktopOnly: false`).
- **Must-have Markdown:** headings, paragraphs/lists, images, tables, code, callouts, wikilinks-as-text, footnotes.
- **Out of scope:** math, dark/CSS themes, sidebar preview, Chrome handoff.
- **Naming:** no CV/resume/ATS wording in docs or samples (user request). Keep content generic.

## Architecture (current)

```
Command/Ribbon
  → ExportModal
    → renderNoteToDom (MarkdownRenderer, offscreen, print CSS)
    → prepareDomForPdf (inline images, flatten wikilinks, materialize list markers, force table header colors)
    → layoutDomToPdf (jsPDF real text + jspdf-autotable)
    → writeBinary beside note / exportFolder
    → optional open PDF
```

### Key files

| File | Role |
| --- | --- |
| `src/main.ts` | Plugin lifecycle, command, ribbon |
| `src/settings.ts` | Defaults + Settings tab |
| `src/ui/ExportModal.ts` | Modal UX + progress `%` |
| `src/render/renderNote.ts` | Offscreen MarkdownRenderer |
| `src/render/prepareDom.ts` | DOM fixups before layout |
| `src/pdf/printCss.ts` | Light print CSS for offscreen DOM |
| `src/pdf/textLayout.ts` | **Main layout engine** + `SPACE` knobs |
| `src/pdf/exportPdf.ts` | Orchestration + path helpers |
| `scripts/generate-sample-pdf.mjs` | Headless spacing QA (generic sample note) |
| `fixtures/feature-kitchen-sink.md` | Feature fixture |
| `fixtures/sample-output/` | Generated QA artifacts (**gitignored**) |

### PDF approach history (important)

1. **First attempt:** html2canvas per block → image PDF. Selectable? **No.** ATS? **No.** Also had mid-line crop bugs and missing bullets when capturing lone `li`s.
2. **Current:** **jsPDF text drawing** (+ autotable). Selectable text. Unicode punctuation normalized for Helvetica (em dash → `-`, etc.).
3. User still cares about **vertical spacing** matching a clean document look (originally compared to desktop Obsidian Export to PDF / a personal note used only for QA — do not reference that note in repo docs).

### Critical bugs already fixed

- **Huge blank page regions:** whole tall lists were deferred to next page. Fixed by expanding `ul`/`ol` to per-`li` blocks, then later by text layout.
- **Mid-glyph crop:** image slicer cut through lines. Fixed by not slicing text that fits on one page; lists paginate per item.
- **Missing bullets:** `::marker` outside `li` box clipped by canvas. Fixed by materializing `• ` / `1. ` text markers in `prepareDom`.
- **Text overlap (title/date/bullets stacked):** `drawRuns` only advanced `0.2 * lineMm` past baseline. Fixed to advance a full `lineMm`.
- **Frozen modal spinner:** main-thread html2canvas; mitigated with yields + `%` progress. Less critical now with text layout (still yields between blocks).
- **Grey table headers:** theme muted colors; forced black via CSS + inline styles.

### Spacing iteration (user workflow)

Edit `SPACE` in `src/pdf/textLayout.ts` (keep `scripts/generate-sample-pdf.mjs` in sync if using sample script).

Current values (mm):

```ts
h1After: 2.5
h2Before: 1.0
h2After: 1.8      // heading → paragraph/table
h3Before: 0.8     // section → subheading
h3After: 2.2
pAfter: 2.0
pMetaAfter: 2.4   // short italic line → first bullet
liAfter: 0        // between bullets (= liLine; no extra gap)
liLine: 5.2
bodyLine: 5.2
hrBefore: 2.0
hrAfter: 6.0
afterTable: 2.5
```

**Reinstall one-liner:**

```bash
cd /Users/victor.arsjad/Projects/personal/obsidian-android-md2pdf
npm run build && cp main.js manifest.json styles.css \
  "/Users/victor.arsjad/obsidian/Everything/.obsidian/plugins/obsidian-android-md2pdf/"
# then Cmd+R in Obsidian
```

**Optional sample PNG:**

```bash
node scripts/generate-sample-pdf.mjs
open fixtures/sample-output/spacing-sample.png
```

User preference: change knobs by ~0.5–1.0 mm; they previously found bullets/heading gaps too large after an overshoot, then tightened.

## Git / process notes

- Latest commit on `master`: `b56e0b9` — rename to `obsidian-android-md2pdf` + scrub CV wording.
- `main.js` **is committed** (BRAT-friendly).
- `fixtures/sample-output/` is gitignored.
- Local `git commit` wrapper may inject `--trailer` which fails on system git 2.27. Use `/usr/local/git/bin/git commit ...` if needed.
- Push works via SSH: `git@github.com:VictorArsjad/obsidian-android-md2pdf.git`.
- User has ADHD mode skill active in prior chat (`i-have-adhd`): lead with action, numbered steps, no preamble/pleasantries, cap lists, concrete next step. Confirm only if they say “stop adhd mode”.

## Vault state

- Plugin enabled as `obsidian-android-md2pdf` in `community-plugins.json`.
- Old folder `plugins/obsidian-android-md-pdf` should be removed if still present; new folder is `obsidian-android-md2pdf`.

## Suggested next work (if user continues)

1. Further spacing polish from live Obsidian exports (text layout, not sample script alone).
2. Edge cases: complex callouts, nested lists, wide tables, footnotes pagination.
3. Optional: embed a Unicode TTF for better punctuation without ASCII normalization.
4. Release tags / BRAT install docs using GitHub URL.
5. Do **not** reintroduce CV/resume/ATS marketing language unless user asks.

## Do not redo

- Do not go back to full-document html2canvas as the primary path (user needs selectable text).
- Do not restore live preview sidebar (performance).
- Do not name samples or docs after personal job-application notes.
