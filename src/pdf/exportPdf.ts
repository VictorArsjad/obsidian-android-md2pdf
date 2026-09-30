import { App, Notice, TFile } from "obsidian";
import type { PdfPluginSettings } from "../settings";
import {
	cleanupRenderedNote,
	renderNoteToDom,
} from "../render/renderNote";
import { prepareDomForPdf } from "../render/prepareDom";
import { layoutDomToPdf } from "./textLayout";

export interface ExportResult {
	pdfPath: string;
}

/**
 * Render the active note and write a selectable, ATS-friendly PDF
 * (real text layer via jsPDF — not a screenshot).
 */
export async function exportNoteToPdf(
	app: App,
	file: TFile,
	settings: PdfPluginSettings,
	onProgress?: (message: string) => void,
): Promise<ExportResult> {
	const pdfPath = resolvePdfPath(file, settings);
	await assertCanWrite(app, pdfPath, settings.overwriteExisting);

	onProgress?.("Rendering note…");
	const rendered = await renderNoteToDom(app, file);

	try {
		onProgress?.("Preparing content…");
		await prepareDomForPdf(app, rendered.root, file);

		onProgress?.("Building PDF…");
		const pdfBytes = await layoutDomToPdf(rendered.root, onProgress);

		onProgress?.("Saving…");
		await ensureParentFolder(app, pdfPath);
		await app.vault.adapter.writeBinary(pdfPath, pdfBytes);

		return { pdfPath };
	} finally {
		cleanupRenderedNote(rendered);
	}
}

export function resolvePdfPath(file: TFile, settings: PdfPluginSettings): string {
	const name = `${file.basename}.pdf`;
	const folder = settings.exportFolder.trim().replace(/^\/+|\/+$/g, "");

	if (!folder) {
		const parent = file.parent?.path ?? "";
		return parent && parent !== "/" ? `${parent}/${name}` : name;
	}

	return `${folder}/${name}`;
}

async function assertCanWrite(
	app: App,
	pdfPath: string,
	overwriteExisting: boolean,
): Promise<void> {
	const exists = await app.vault.adapter.exists(pdfPath);
	if (exists && !overwriteExisting) {
		throw new Error(
			`PDF already exists: ${pdfPath}. Enable “Overwrite existing PDF” in settings, or delete the file.`,
		);
	}
}

async function ensureParentFolder(app: App, pdfPath: string): Promise<void> {
	const parts = pdfPath.split("/");
	if (parts.length < 2) return;

	const folder = parts.slice(0, -1).join("/");
	if (!folder) return;

	const exists = await app.vault.adapter.exists(folder);
	if (!exists) {
		await app.vault.createFolder(folder);
	}
}

export async function openPdfIfPresent(
	app: App,
	pdfPath: string,
): Promise<void> {
	const abstract = app.vault.getAbstractFileByPath(pdfPath);
	if (abstract instanceof TFile) {
		await app.workspace.getLeaf(true).openFile(abstract);
		return;
	}
	new Notice(`Saved ${pdfPath}`);
}
