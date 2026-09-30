# Android MD2PDF

Obsidian plugin that exports the current Markdown note to a **`.pdf` inside the vault** on Android.

- Real **selectable text** (not a screenshot)
- No sidebar / live preview
- Light pages only
- Command → modal → Export; settings are saved and reused

## Install (Android)

### BRAT (recommended)

Install from GitHub with [BRAT](https://github.com/TfTHacker/obsidian42-brat) (works on Android):

1. Install **BRAT** from Community plugins and enable it
2. Open **BRAT** settings → **Add Beta plugin**
3. Paste this repository URL:

```text
https://github.com/VictorArsjad/obsidian-android-md2pdf
```

4. Enable **Android MD2PDF** under Community plugins
5. Optional: use BRAT’s **Check for updates** when you want the latest `master`

### Manual

1. Build or download `main.js`, `manifest.json`, and `styles.css`
2. Copy them into:

```text
<vault>/.obsidian/plugins/obsidian-android-md2pdf/
```

3. Reload Obsidian → enable **Android MD2PDF** under Community plugins

### Local build → vault

```bash
npm install
npm run build
# copy main.js manifest.json styles.css into your vault plugin folder
```

## Usage

1. Open a Markdown note
2. Command palette → **Android MD2PDF: Export note to PDF**
3. Confirm destination → **Export**

Default destination: **beside the note**  
Example: `Notes/My Note.md` → `Notes/My Note.pdf`

## Settings (persisted)

| Setting | Default | Meaning |
| --- | --- | --- |
| Export folder | empty | Empty = beside note; else vault-relative folder |
| Open PDF after export | on | Open the PDF in Obsidian |
| Overwrite existing PDF | on | Replace same-named PDF without prompting |

## Supported (v1)

Headings, paragraphs, lists, tables (text), code blocks, callouts (as text), wikilinks as text, footnotes, images (embedded when present).

Some Unicode punctuation is normalized for PDF core fonts (e.g. em dash → `-`) so Helvetica renders reliably.

Out of scope: math, dark themes, live preview, Chrome/print handoff.

## QA

- Fixture: [`fixtures/feature-kitchen-sink.md`](fixtures/feature-kitchen-sink.md)
- Optional layout sample: `node scripts/generate-sample-pdf.mjs` → `fixtures/sample-output/`

After export: select text in the PDF viewer and paste into a text editor to confirm the text layer is real.

## Develop

```bash
npm install
npm run dev
npm run build
```
