# Android MD PDF

Obsidian plugin that exports the current Markdown note to a **`.pdf` inside the vault** on Android.

Built for **resume / CV export**:

- Real **selectable text** (ATS-friendly text layer — not a screenshot)
- No sidebar / live preview
- Light pages only
- Command → modal → Export; settings are saved and reused

## Install (Android)

### Manual

1. Build or download `main.js`, `manifest.json`, and `styles.css`
2. Copy them into:

```text
<vault>/.obsidian/plugins/obsidian-android-md-pdf/
```

3. Reload Obsidian → enable **Android MD PDF** under Community plugins

### Local build → vault

```bash
npm install
npm run build
# copy main.js manifest.json styles.css into your vault plugin folder
```

## Usage

1. Open a Markdown note
2. Command palette → **Android MD PDF: Export note to PDF**
3. Confirm destination → **Export**

Default destination: **beside the note**  
Example: `Growth/Applications/Jetbrains/cv.md` → `Growth/Applications/Jetbrains/cv.pdf`

## Settings (persisted)

| Setting | Default | Meaning |
| --- | --- | --- |
| Export folder | empty | Empty = beside note; else vault-relative folder |
| Open PDF after export | on | Open the PDF in Obsidian |
| Overwrite existing PDF | on | Replace same-named PDF without prompting |

## Supported (v1)

Headings, paragraphs, lists, tables (text), code blocks, callouts (as text), wikilinks as text, footnotes, images (embedded when present).

Some Unicode punctuation is normalized for PDF core fonts (e.g. em dash → `-`) so Helvetica stays reliable for ATS parsers.

Out of scope: math, dark themes, live preview, Chrome/print handoff.

## QA

- Resume target: `cv_victor_arsjad.md`
- Fixture: [`fixtures/feature-kitchen-sink.md`](fixtures/feature-kitchen-sink.md)

After export: select text in the PDF viewer and paste into a text editor. If that works, ATS can usually read it too.

## Develop

```bash
npm install
npm run dev
npm run build
```
