import { App, ButtonComponent, Modal, Notice, Setting, TFile } from "obsidian";
import type { PdfPluginSettings } from "../settings";
import {
	exportNoteToPdf,
	openPdfIfPresent,
	resolvePdfPath,
} from "../pdf/exportPdf";

export class ExportModal extends Modal {
	private file: TFile;
	private settings: PdfPluginSettings;
	private statusEl: HTMLElement | null = null;
	private exportBtn: ButtonComponent | null = null;
	private cancelBtn: ButtonComponent | null = null;
	private exporting = false;

	constructor(app: App, file: TFile, settings: PdfPluginSettings) {
		super(app);
		this.file = file;
		this.settings = settings;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("android-md-pdf-modal");

		contentEl.createEl("h2", { text: "Export to PDF" });
		contentEl.createEl("p", {
			text: `Note: ${this.file.basename}`,
		});

		const dest = resolvePdfPath(this.file, this.settings);
		contentEl.createEl("p", {
			cls: "android-md-pdf-dest",
			text: `Destination: ${dest}`,
		});

		this.statusEl = contentEl.createEl("p", {
			cls: "android-md-pdf-status",
			text: "",
		});

		new Setting(contentEl)
			.addButton((btn) => {
				this.cancelBtn = btn;
				btn.setButtonText("Cancel").onClick(() => {
					if (!this.exporting) this.close();
				});
			})
			.addButton((btn) => {
				this.exportBtn = btn;
				btn
					.setButtonText("Export")
					.setCta()
					.onClick(async () => {
						await this.runExport();
					});
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private setStatus(message: string): void {
		if (this.statusEl) this.statusEl.setText(message);
	}

	private setBusy(busy: boolean): void {
		this.exporting = busy;
		this.exportBtn?.setDisabled(busy);
		this.exportBtn?.setButtonText(busy ? "Exporting…" : "Export");
		this.cancelBtn?.setDisabled(busy);
	}

	private async runExport(): Promise<void> {
		if (this.exporting) return;
		this.setBusy(true);
		this.setStatus("Starting…");

		try {
			const { pdfPath } = await exportNoteToPdf(
				this.app,
				this.file,
				this.settings,
				(msg) => this.setStatus(msg),
			);

			new Notice(`Saved ${pdfPath}`);
			this.setStatus(`Saved ${pdfPath}`);

			if (this.settings.openAfterExport) {
				await openPdfIfPresent(this.app, pdfPath);
			}

			this.close();
		} catch (error) {
			console.error("[Android MD PDF] Export failed", error);
			const message =
				error instanceof Error ? error.message : String(error);
			this.setStatus(message);
			new Notice(`PDF export failed: ${message}`);
			this.setBusy(false);
		}
	}
}
