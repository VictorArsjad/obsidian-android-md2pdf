import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PAGE } from "./printCss";

type FontStyle = "normal" | "bold" | "italic" | "bolditalic";

interface TextRun {
	text: string;
	bold: boolean;
	italic: boolean;
	code: boolean;
}

interface LayoutState {
	doc: jsPDF;
	y: number;
	margin: number;
	contentWidth: number;
	pageBottom: number;
	contentHeight: number;
}

const FONT = "helvetica";

	/** Document vertical rhythm (mm). */
const SPACE = {
	h1Before: 0,
	h1After: 2.5,
	h2Before: 1.0,
	h2After: 1.8, // heading → paragraph / table
	h3Before: 0.8, // section heading → subheading
	h3After: 2.2, // subheading → following line
	h4Before: 1.5,
	h4After: 1.4,
	pAfter: 2.0,
	pMetaAfter: 2.4, // following line → first bullet
	liAfter: 0.8, // between bullets
	liLine: 4.6,
	bodyLine: 4.6,
	hrBefore: 2.0,
	hrAfter: 6.0,
	bulletIndent: 6,
	bulletPad: 1.2,
	afterTable: 2.5,
};

/**
 * Build a selectable, selectable PDF by drawing real text (not images).
 */
export async function layoutDomToPdf(
	root: HTMLElement,
	onProgress?: (message: string) => void,
): Promise<ArrayBuffer> {
	const doc = new jsPDF({
		orientation: "p",
		unit: "mm",
		format: "a4",
		compress: true,
	});

	const margin = PAGE.marginMm;
	const contentWidth = PAGE.widthMm - margin * 2;
	const contentHeight = PAGE.heightMm - margin * 2;
	const state: LayoutState = {
		doc,
		y: margin,
		margin,
		contentWidth,
		pageBottom: PAGE.heightMm - margin,
		contentHeight,
	};

	fillWhite(doc);
	const blocks = getExportBlocks(root);
	const total = Math.max(blocks.length, 1);

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		if (isEffectivelyEmpty(block)) continue;

		const pct = Math.min(99, Math.round(((i + 1) / total) * 100));
		onProgress?.(`Building PDF… ${pct}%`);
		await yieldToUi();

		await drawBlock(state, block);
	}

	onProgress?.("Building PDF… 100%");
	return doc.output("arraybuffer") as ArrayBuffer;
}

async function drawBlock(state: LayoutState, el: HTMLElement): Promise<void> {
	const tag = el.tagName.toLowerCase();

	if (tag === "h1") {
		return drawHeading(
			state,
			el,
			18,
			7,
			SPACE.h1Before,
			SPACE.h1After,
		);
	}
	if (tag === "h2") {
		return drawHeading(
			state,
			el,
			14,
			6,
			SPACE.h2Before,
			SPACE.h2After,
		);
	}
	if (tag === "h3") {
		return drawHeading(
			state,
			el,
			12,
			5.2,
			SPACE.h3Before,
			SPACE.h3After,
		);
	}
	if (tag === "h4" || tag === "h5" || tag === "h6") {
		return drawHeading(
			state,
			el,
			11,
			4.8,
			SPACE.h4Before,
			SPACE.h4After,
		);
	}
	if (tag === "p") {
		return drawParagraph(state, el, 10, SPACE.bodyLine, SPACE.pAfter);
	}
	if (tag === "li") {
		return drawListItem(state, el, 10, SPACE.liLine);
	}
	if (tag === "blockquote" || el.classList.contains("callout")) {
		return drawCallout(state, el);
	}
	if (tag === "hr") return drawHr(state);
	if (tag === "table") return drawTable(state, el);
	if (tag === "pre") return drawPre(state, el);
	if (tag === "ul" || tag === "ol") {
		const items = Array.from(el.children).filter(
			(c): c is HTMLElement =>
				c instanceof HTMLElement && c.tagName === "LI",
		);
		for (const li of items) await drawListItem(state, li, 10, SPACE.liLine);
		return;
	}
	if (tag === "img") return drawImage(state, el as HTMLImageElement);

	const kids = Array.from(el.children).filter(
		(c): c is HTMLElement => c instanceof HTMLElement,
	);
	if (kids.length > 0) {
		for (const kid of kids) await drawBlock(state, kid);
		return;
	}
	return drawParagraph(state, el, 10, SPACE.bodyLine, SPACE.pAfter);
}

function drawHeading(
	state: LayoutState,
	el: HTMLElement,
	size: number,
	lineMm: number,
	gapBefore: number,
	gapAfter: number,
): void {
	ensureSpace(state, gapBefore + lineMm + 2);
	state.y += gapBefore;
	const runs = collectRuns(el).map((r) => ({ ...r, bold: true }));
	state.y = drawRuns(
		state,
		runs,
		state.margin,
		state.y,
		size,
		lineMm,
		state.contentWidth,
	);
	state.y += gapAfter;
}

function drawParagraph(
	state: LayoutState,
	el: HTMLElement,
	size: number,
	lineMm: number,
	gapAfter: number,
): void {
	const runs = collectRuns(el);
	if (!runs.some((r) => r.text.trim())) {
		state.y += 1;
		return;
	}

	const plain = runs.map((r) => r.text).join("");
	const mostlyItalic =
		runs.every((r) => r.italic || !r.text.trim()) &&
		plain.trim().length > 0;
	const shortMeta = mostlyItalic && plain.trim().length < 100;
	const gap = shortMeta ? SPACE.pMetaAfter : gapAfter;

	ensureSpace(state, lineMm + 1);
	state.y = drawRuns(
		state,
		runs,
		state.margin,
		state.y,
		size,
		lineMm,
		state.contentWidth,
	);
	state.y += gap;
}

function drawListItem(
	state: LayoutState,
	el: HTMLElement,
	size: number,
	lineMm: number,
): void {
	const markerEl = el.querySelector(":scope > .android-md2pdf-marker");
	const markerText = markerEl?.textContent?.trim() || "•";
	if (markerEl) markerEl.remove();

	const runs = collectRuns(el);
	const textX = state.margin + SPACE.bulletIndent;
	const textWidth = state.contentWidth - SPACE.bulletIndent;

	ensureSpace(state, lineMm + SPACE.liAfter);
	setFont(state.doc, size, false, false, false);
	state.doc.text(
		normalizeText(markerText),
		state.margin + SPACE.bulletPad,
		state.y,
	);

	// Hanging indent: wrapped lines start at textX, not under the bullet.
	const after = drawRuns(state, runs, textX, state.y, size, lineMm, textWidth);
	// drawRuns advances a full line past the last baseline; pull most of that
	// back so bullets sit closer than body paragraphs.
	state.y = after - lineMm * 0.4 + SPACE.liAfter;
}

function drawCallout(state: LayoutState, el: HTMLElement): void {
	const title =
		el.querySelector(".callout-title")?.textContent?.trim() || "";
	const body = el.querySelector(".callout-content") || el;
	ensureSpace(state, 10);
	state.doc.setDrawColor(140);
	state.doc.setLineWidth(0.6);
	state.doc.line(state.margin, state.y - 1, state.margin, state.y + 8);

	if (title) {
		const titleRuns: TextRun[] = [
			{ text: title, bold: true, italic: false, code: false },
		];
		state.y = drawRuns(
			state,
			titleRuns,
			state.margin + 3,
			state.y,
			10,
			SPACE.bodyLine,
			state.contentWidth - 3,
		);
		state.y += 1;
	}
	const runs = collectRuns(body as HTMLElement);
	state.y = drawRuns(
		state,
		runs,
		state.margin + 3,
		state.y,
		10,
		SPACE.bodyLine,
		state.contentWidth - 3,
	);
	state.y += 3;
}

function drawHr(state: LayoutState): void {
	ensureSpace(state, SPACE.hrBefore + SPACE.hrAfter + 2);
	state.y += SPACE.hrBefore;
	state.doc.setDrawColor(180);
	state.doc.setLineWidth(0.25);
	state.doc.line(
		state.margin,
		state.y,
		state.margin + state.contentWidth,
		state.y,
	);
	state.y += SPACE.hrAfter;
}

function drawTable(state: LayoutState, table: HTMLElement): void {
	const rows = Array.from(table.querySelectorAll("tr"));
	if (rows.length === 0) return;

	const matrix = rows.map((row) =>
		Array.from(row.querySelectorAll("th, td")).map((cell) =>
			normalizeText(cell.textContent || "").trim(),
		),
	);

	const hasHeader = rows[0].querySelector("th") != null;
	const head = hasHeader ? [matrix[0]] : undefined;
	const body = hasHeader ? matrix.slice(1) : matrix;

	ensureSpace(state, 12);

	autoTable(state.doc, {
		startY: state.y,
		head,
		body,
		theme: "grid",
		styles: {
			font: FONT,
			fontSize: 9,
			textColor: [0, 0, 0],
			lineColor: [180, 180, 180],
			lineWidth: 0.1,
			cellPadding: 1.4,
			overflow: "linebreak",
			valign: "top",
		},
		headStyles: {
			fillColor: [242, 242, 242],
			textColor: [0, 0, 0],
			fontStyle: "bold",
			font: FONT,
		},
		bodyStyles: {
			textColor: [0, 0, 0],
			font: FONT,
		},
		margin: { left: state.margin, right: state.margin },
		tableWidth: state.contentWidth,
	});

	const docAny = state.doc as jsPDF & {
		lastAutoTable?: { finalY: number };
	};
	state.y = (docAny.lastAutoTable?.finalY ?? state.y) + SPACE.afterTable;
}

function drawPre(state: LayoutState, el: HTMLElement): void {
	const text = normalizeText(el.textContent || "");
	const size = 8.5;
	const lineMm = 4;
	ensureSpace(state, lineMm + 2);
	setFont(state.doc, size, false, false, true);
	const lines = state.doc.splitTextToSize(text, state.contentWidth) as string[];
	for (const line of lines) {
		ensureSpace(state, lineMm);
		state.doc.text(line, state.margin, state.y);
		state.y += lineMm;
	}
	state.y += 2.5;
}

function drawImage(state: LayoutState, img: HTMLImageElement): void {
	const src = img.getAttribute("src") || "";
	if (!src.startsWith("data:")) return;

	const maxW = state.contentWidth;
	const maxH = 80;
	let w = maxW;
	let h = 40;
	if (img.naturalWidth > 0 && img.naturalHeight > 0) {
		const ratio = img.naturalHeight / img.naturalWidth;
		w = maxW;
		h = Math.min(maxH, w * ratio);
	}
	ensureSpace(state, h + 2);
	try {
		const format = src.includes("image/png") ? "PNG" : "JPEG";
		state.doc.addImage(src, format, state.margin, state.y, w, h);
		state.y += h + 3;
	} catch (e) {
		console.warn("[Android MD2PDF] image add failed", e);
	}
}

function drawRuns(
	state: LayoutState,
	runs: TextRun[],
	xStart: number,
	yStart: number,
	size: number,
	lineMm: number,
	maxWidth: number,
): number {
	const words = flattenToWords(runs);
	if (words.length === 0) return yStart;

	let x = xStart;
	let y = yStart;
	const maxX = xStart + maxWidth;

	const breakLine = () => {
		x = xStart;
		y += lineMm;
		if (y + lineMm > state.pageBottom) {
			newPage(state);
			y = state.margin;
		}
	};

	if (y + lineMm > state.pageBottom) {
		newPage(state);
		y = state.margin;
	}

	for (const word of words) {
		if (word.text === "\n") {
			breakLine();
			continue;
		}

		setFont(state.doc, size, word.bold, word.italic, word.code);
		const width = state.doc.getTextWidth(word.text);

		if (x > xStart && x + width > maxX) {
			breakLine();
		}

		state.doc.text(word.text, x, y);
		x += width;
	}

	// Advance a full line below the last baseline so the next block cannot overlap.
	state.y = y + lineMm;
	return state.y;
}

function flattenToWords(runs: TextRun[]): TextRun[] {
	const out: TextRun[] = [];
	for (const run of runs) {
		const parts = run.text.split(/(\s+|\n)/);
		for (const part of parts) {
			if (!part) continue;
			out.push({
				text: part,
				bold: run.bold,
				italic: run.italic,
				code: run.code,
			});
		}
	}
	return out;
}

function collectRuns(root: Node): TextRun[] {
	const runs: TextRun[] = [];

	const walk = (
		node: Node,
		bold: boolean,
		italic: boolean,
		code: boolean,
	) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const raw = node.textContent || "";
			const text = normalizeText(raw);
			if (text) runs.push({ text, bold, italic, code });
			return;
		}
		if (node.nodeType !== Node.ELEMENT_NODE) return;

		const el = node as HTMLElement;
		const tag = el.tagName.toLowerCase();
		if (tag === "br") {
			runs.push({ text: "\n", bold, italic, code });
			return;
		}
		if (
			tag === "script" ||
			tag === "style" ||
			el.classList.contains("edit-block-button")
		) {
			return;
		}

		const nextBold =
			bold || tag === "strong" || tag === "b" || el.style.fontWeight === "bold" ||
			parseInt(el.style.fontWeight || "0", 10) >= 600;
		const nextItalic =
			italic || tag === "em" || tag === "i" || el.style.fontStyle === "italic";
		const nextCode = code || tag === "code" || tag === "pre";

		for (const child of Array.from(el.childNodes)) {
			walk(child, nextBold, nextItalic, nextCode);
		}
	};

	walk(root, false, false, false);
	return mergeRuns(runs);
}

function mergeRuns(runs: TextRun[]): TextRun[] {
	if (runs.length === 0) return runs;
	const out: TextRun[] = [{ ...runs[0] }];
	for (let i = 1; i < runs.length; i++) {
		const prev = out[out.length - 1];
		const cur = runs[i];
		if (
			prev.bold === cur.bold &&
			prev.italic === cur.italic &&
			prev.code === cur.code &&
			cur.text !== "\n" &&
			prev.text !== "\n"
		) {
			prev.text += cur.text;
		} else {
			out.push({ ...cur });
		}
	}
	return out;
}

function setFont(
	doc: jsPDF,
	size: number,
	bold: boolean,
	italic: boolean,
	code: boolean,
): void {
	const family = code ? "courier" : FONT;
	let style: FontStyle = "normal";
	if (bold && italic) style = "bolditalic";
	else if (bold) style = "bold";
	else if (italic) style = "italic";
	doc.setFont(family, style);
	doc.setFontSize(size);
	doc.setTextColor(0, 0, 0);
}

function ensureSpace(state: LayoutState, needMm: number): void {
	if (state.y + needMm > state.pageBottom) {
		newPage(state);
	}
}

function newPage(state: LayoutState): void {
	state.doc.addPage();
	fillWhite(state.doc);
	state.y = state.margin;
}

function fillWhite(doc: jsPDF): void {
	doc.setFillColor(255, 255, 255);
	doc.rect(0, 0, PAGE.widthMm, PAGE.heightMm, "F");
}

function getExportBlocks(root: HTMLElement): HTMLElement[] {
	const blocks: HTMLElement[] = [];
	collectBlocks(root, blocks);
	if (blocks.length === 0) blocks.push(root);
	return blocks;
}

function collectBlocks(parent: HTMLElement, out: HTMLElement[]): void {
	for (const child of Array.from(parent.children)) {
		if (!(child instanceof HTMLElement)) continue;
		if (
			child.classList.contains("markdown-preview-sizer") ||
			child.classList.contains("markdown-preview-section")
		) {
			collectBlocks(child, out);
			continue;
		}
		const tag = child.tagName;
		if (tag === "UL" || tag === "OL") {
			const items = Array.from(child.children).filter(
				(c): c is HTMLElement =>
					c instanceof HTMLElement && c.tagName === "LI",
			);
			if (items.length > 0) {
				out.push(...items);
				continue;
			}
		}
		out.push(child);
	}
}

function isEffectivelyEmpty(el: HTMLElement): boolean {
	const text = (el.textContent || "").replace(/\u200B/g, "").trim();
	if (text.length > 0) return false;
	if (el.querySelector("img, table, pre, svg")) return false;
	if (el.tagName === "HR") return false;
	return true;
}

/** Map characters Helvetica often lacks into core-font-safe ASCII-ish equivalents. */
function normalizeText(input: string): string {
	return input
		.replace(/\u00a0/g, " ")
		.replace(/[\u2013\u2014\u2212]/g, "-")
		.replace(/[\u2018\u2019\u2032]/g, "'")
		.replace(/[\u201c\u201d\u2033]/g, '"')
		.replace(/\u2026/g, "...")
		.replace(/\u00b7/g, "·")
		.replace(/\u2022/g, "•")
		.replace(/[^\S\n]+/g, " ");
}

function yieldToUi(): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, 0);
	});
}
