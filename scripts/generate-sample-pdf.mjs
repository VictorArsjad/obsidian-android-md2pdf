/**
 * Generate a sample PDF with the same spacing rules as the plugin
 * (no Obsidian runtime required). Used to visually QA layout.
 *
 * Usage: node scripts/generate-sample-pdf.mjs
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "fixtures", "sample-output");
fs.mkdirSync(outDir, { recursive: true });

const PAGE = { widthMm: 210, heightMm: 297, marginMm: 15 };
const FONT = "helvetica";
const SPACE = {
	h1After: 2.5,
	h2Before: 1.0,
	h2After: 1.8,
	h3Before: 0.8,
	h3After: 2.2,
	pAfter: 2.0,
	pMetaAfter: 2.4,
	liAfter: 0,
	liLine: 5.2,
	bodyLine: 5.2,
	hrBefore: 2.0,
	hrAfter: 6.0,
	bulletIndent: 6,
	bulletPad: 1.2,
};

const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
const margin = PAGE.marginMm;
const contentWidth = PAGE.widthMm - margin * 2;
let y = margin;

function fill() {
	doc.setFillColor(255, 255, 255);
	doc.rect(0, 0, PAGE.widthMm, PAGE.heightMm, "F");
}
function ensure(need) {
	if (y + need > PAGE.heightMm - margin) {
		doc.addPage();
		fill();

setFont(18, true);
doc.text("Sample Note", margin, y);
y += 7 + SPACE.h1After;

p(
	"This is a short sample used to check heading, paragraph, list, and divider spacing in the PDF exporter.",
);

hr();
h2("Overview");
p(
	"Export turns the rendered Markdown structure into a selectable PDF text layer. Adjust SPACE values in the plugin source, rebuild, and compare this sample output when iterating on layout.",
);
hr();
h2("Details");
h3("Layout checklist");
meta("Used for local visual QA of vertical rhythm");
li("Headings should sit close to the following paragraph without overlapping.");
li("List items should be readable as separate bullets without large empty bands.");
li("Dividers should leave clear space before the next section heading.");

hr();
h2("Notes");
li("Keep sample content generic so layout QA does not depend on a specific vault note.");
li("Open the generated PNG after running this script to inspect spacing quickly.");

const pdfPath = path.join(outDir, "spacing-sample.pdf");
const buf = Buffer.from(doc.output("arraybuffer"));
fs.writeFileSync(pdfPath, buf);
console.log("Wrote", pdfPath);

// Rasterize page 1 for visual QA
const pngPath = path.join(outDir, "spacing-sample.png");
const { spawnSync } = await import("child_process");
const r = spawnSync(
	"magick",
	["-density", "150", `${pdfPath}[0]`, "-background", "white", "-alpha", "remove", pngPath],
	{ encoding: "utf8" },
);
if (r.status === 0) console.log("Wrote", pngPath);
else {
	console.error("magick failed", r.stderr || r.stdout);
	process.exitCode = 1;
}
