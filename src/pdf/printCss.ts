/**
 * Light print stylesheet aimed at Obsidian desktop Export to PDF spacing.
 * Applied to the offscreen render container (not the live vault UI).
 */
export const PRINT_CSS = `
.android-md2pdf-root {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  color: #000000;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.android-md2pdf-root *,
.android-md2pdf-root *::before,
.android-md2pdf-root *::after {
  box-sizing: border-box;
}

.android-md2pdf-root p {
  margin-top: 0;
  margin-bottom: 0.85em;
}

.android-md2pdf-root h1,
.android-md2pdf-root h2,
.android-md2pdf-root h3,
.android-md2pdf-root h4,
.android-md2pdf-root h5,
.android-md2pdf-root h6 {
  color: #000000;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.25em;
  margin-bottom: 0.5em;
  page-break-after: avoid;
}

.android-md2pdf-root h1 { font-size: 1.7em; margin-top: 0; }
.android-md2pdf-root h2 { font-size: 1.4em; }
.android-md2pdf-root h3 { font-size: 1.2em; }
.android-md2pdf-root h4 { font-size: 1.1em; }
.android-md2pdf-root h5,
.android-md2pdf-root h6 { font-size: 1em; }

.android-md2pdf-root > :first-child {
  margin-top: 0;
}

.android-md2pdf-root ul,
.android-md2pdf-root ol {
  margin-top: 0;
  margin-bottom: 0.85em;
  padding-left: 0.25em;
  list-style: none;
}

.android-md2pdf-root li {
  margin-top: 0.15em;
  margin-bottom: 0.35em;
  display: block;
  list-style: none;
}

.android-md2pdf-root li > .android-md2pdf-marker {
  display: inline;
  font-weight: 700;
  margin-right: 0.35em;
  color: #000000 !important;
}

.android-md2pdf-root li > p {
  margin-top: 0.15em;
  margin-bottom: 0.15em;
}

.android-md2pdf-root blockquote {
  margin: 0.85em 0;
  padding: 0 0 0 0.9em;
  border-left: 3px solid #cccccc;
  color: #333333;
}

.android-md2pdf-root hr {
  border: none;
  border-top: 1px solid #cccccc;
  margin: 1.1em 0;
}

.android-md2pdf-root a {
  color: #000000;
  text-decoration: underline;
}

.android-md2pdf-root strong { font-weight: 700; }
.android-md2pdf-root em { font-style: italic; }

.android-md2pdf-root code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.9em;
  background: #f2f2f2;
  padding: 0.1em 0.35em;
  border-radius: 3px;
}

.android-md2pdf-root pre {
  margin: 0.85em 0;
  padding: 0.75em 0.9em;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}

.android-md2pdf-root pre code {
  background: transparent;
  padding: 0;
  font-size: 0.85em;
}

.android-md2pdf-root table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.85em 0;
  font-size: 0.95em;
  color: #000000 !important;
}

.android-md2pdf-root th,
.android-md2pdf-root td,
.android-md2pdf-root thead th,
.android-md2pdf-root thead td,
.android-md2pdf-root tbody th,
.android-md2pdf-root tbody td {
  border: 1px solid #cccccc !important;
  padding: 0.4em 0.55em;
  text-align: left;
  vertical-align: top;
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
}

.android-md2pdf-root th,
.android-md2pdf-root thead th,
.android-md2pdf-root thead td {
  background: #f2f2f2 !important;
  font-weight: 700 !important;
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
  opacity: 1 !important;
}

.android-md2pdf-root img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0.75em 0;
}

.android-md2pdf-root .internal-embed {
  display: block;
  margin: 0.75em 0;
}

.android-md2pdf-root .callout {
  margin: 0.85em 0;
  padding: 0.75em 0.9em;
  border-left: 4px solid #888888;
  background: #f7f7f7;
  border-radius: 2px;
}

.android-md2pdf-root .callout-title {
  font-weight: 600;
  margin-bottom: 0.35em;
}

.android-md2pdf-root .callout-content > :first-child {
  margin-top: 0;
}

.android-md2pdf-root .callout-content > :last-child {
  margin-bottom: 0;
}

.android-md2pdf-root .footnote-backref,
.android-md2pdf-root .footnote-link {
  text-decoration: none;
}

.android-md2pdf-root section[data-footnotes],
.android-md2pdf-root .footnotes {
  margin-top: 1.5em;
  padding-top: 0.75em;
  border-top: 1px solid #cccccc;
  font-size: 0.9em;
}

.android-md2pdf-root .cm-embed-block,
.android-md2pdf-root .edit-block-button,
.android-md2pdf-root .markdown-embed-link,
.android-md2pdf-root .file-embed-link {
  display: none !important;
}
`;

/** Pixel width of the offscreen render surface (≈ A4 content width at 96dpi). */
export const RENDER_WIDTH_PX = 720;

/** A4 page metrics in mm. */
export const PAGE = {
	widthMm: 210,
	heightMm: 297,
	marginMm: 15,
};
