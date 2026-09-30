/**
 * Generate a sample resume PDF with the same spacing rules as the plugin
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
	liAfter: 0.8,
	liLine: 4.6,
	bodyLine: 4.6,
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
		y = margin;
	}
}
function setFont(size, bold = false, italic = false) {
	let style = "normal";
	if (bold && italic) style = "bolditalic";
	else if (bold) style = "bold";
	else if (italic) style = "italic";
	doc.setFont(FONT, style);
	doc.setFontSize(size);
	doc.setTextColor(0, 0, 0);
}
function drawWrapped(text, x, size, lineMm, maxW, bold = false, italic = false) {
	setFont(size, bold, italic);
	const lines = doc.splitTextToSize(text, maxW);
	for (const line of lines) {
		ensure(lineMm);
		doc.text(line, x, y);
		y += lineMm;
	}
}
function hr() {
	ensure(SPACE.hrBefore + SPACE.hrAfter + 2);
	y += SPACE.hrBefore;
	doc.setDrawColor(180);
	doc.setLineWidth(0.25);
	doc.line(margin, y, margin + contentWidth, y);
	y += SPACE.hrAfter;
}
function h2(text) {
	ensure(SPACE.h2Before + 8);
	y += SPACE.h2Before;
	setFont(14, true);
	doc.text(text, margin, y);
	y += 6 + SPACE.h2After;
}
function h3(text) {
	ensure(SPACE.h3Before + 8);
	y += SPACE.h3Before;
	setFont(12, true);
	doc.text(text, margin, y);
	y += 5.2 + SPACE.h3After;
}
function p(text) {
	drawWrapped(text, margin, 10, SPACE.bodyLine, contentWidth);
	y += SPACE.pAfter;
}
function meta(text) {
	drawWrapped(text, margin, 10, SPACE.bodyLine, contentWidth, false, true);
	y += SPACE.pMetaAfter;
}
function li(text) {
	ensure(SPACE.liLine + SPACE.liAfter);
	setFont(10);
	doc.text("•", margin + SPACE.bulletPad, y);
	const x = margin + SPACE.bulletIndent;
	const lines = doc.splitTextToSize(text, contentWidth - SPACE.bulletIndent);
	for (let i = 0; i < lines.length; i++) {
		if (i > 0) {
			y += SPACE.liLine;
			ensure(SPACE.liLine);
		}
		doc.text(lines[i], x, y);
	}
	y += SPACE.liLine * 0.6 + SPACE.liAfter;
}

fill();

setFont(18, true);
doc.text("Victor Arsjad", margin, y);
y += 7 + SPACE.h1After;

setFont(10, true);
const tagline =
	"Senior Software Engineer | JVM & Enterprise Backend Systems | Kubernetes & Cloud Infrastructure Jakarta, Indonesia · linkedin.com/in/victorarsjad";
drawWrapped(tagline, margin, 10, SPACE.bodyLine, contentWidth, true, false);
y += SPACE.pAfter;

hr();
h2("Summary");
p(
	"Senior Software Engineer with 8 years of experience building enterprise backend systems on the JVM (Java, Kotlin, Spring Boot) and Go, with deep ownership of architecture, Kubernetes-based production infrastructure, and reliability engineering. Led architecture and cross-team alignment for a high-correctness enterprise backend platform, authoring ADRs and driving rollout strategy across more than three teams.",
);
hr();
h2("Experience");
h3("Senior Backend Engineer - Gojek (GoTo)");
meta("Oct 2020 - Present · Greater Jakarta Area, Indonesia");
li(
	"Own architecture and full lifecycle of Curator, an enterprise backend platform for merchant legal entities, contracts, and documents; authored ADRs and drove technical alignment across more than three teams on architecture, tradeoffs, and rollout strategy.",
);
li(
	"Own Kubernetes deployment and configuration for production services - resource manifests, horizontal pod autoscaling (HPA), CPU/memory allocation, and pod-count tuning - to ensure reliable serving capacity under production load.",
);
li(
	"Redesigned the PTEN government registration integration from FTP batch processing to a real-time HTTP API, cutting merchant activation time from ~1 day to 3 minutes and contributing to a 20% increase in conversion.",
);

hr();
h2("Additional Information");
li(
	"AI-Assisted Development - Use Cursor and Claude Code to accelerate delivery while applying rigorous review.",
);
li("Python - Used for internal scripting and automation (not backend frameworks).");
li("Open Source - Active GitHub and open-source contributor.");
li("Languages - English (Professional working proficiency), Bahasa Indonesia (Native).");

const pdfPath = path.join(outDir, "cv-spacing-sample.pdf");
const buf = Buffer.from(doc.output("arraybuffer"));
fs.writeFileSync(pdfPath, buf);
console.log("Wrote", pdfPath);

// Rasterize page 1 for visual QA
const pngPath = path.join(outDir, "cv-spacing-sample.png");
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
