import { Notice, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	PdfPluginSettings,
	PdfSettingTab,
} from "./settings";
import { ExportModal } from "./ui/ExportModal";

export default class AndroidMd2PdfPlugin extends Plugin {
	settings: PdfPluginSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addCommand({
			id: "export-note-to-pdf",
			name: "Export note to PDF",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || file.extension !== "md") return false;
				if (!checking) this.openExportModal(file);
				return true;
			},
		});

		this.addRibbonIcon("file-down", "Export note to PDF", () => {
			const file = this.app.workspace.getActiveFile();
			if (!file || file.extension !== "md") {
				new Notice("Open a Markdown note to export.");
				return;
			}
			this.openExportModal(file);
		});

		this.addSettingTab(new PdfSettingTab(this.app, this));
	}

	onunload(): void {
		/* no persistent views */
	}

	openExportModal(file: TFile): void {
		new ExportModal(this.app, file, this.settings).open();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
