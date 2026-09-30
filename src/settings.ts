import { App, PluginSettingTab, Setting } from "obsidian";
import type AndroidMd2PdfPlugin from "./main";

export interface PdfPluginSettings {
	exportFolder: string;
	openAfterExport: boolean;
	overwriteExisting: boolean;
}

export const DEFAULT_SETTINGS: PdfPluginSettings = {
	exportFolder: "",
	openAfterExport: true,
	overwriteExisting: true,
};

export class PdfSettingTab extends PluginSettingTab {
	plugin: AndroidMd2PdfPlugin;

	constructor(app: App, plugin: AndroidMd2PdfPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Android MD2PDF" });

		new Setting(containerEl)
			.setName("Export folder")
			.setDesc(
				"Vault-relative folder for PDFs. Leave empty to save beside the note (same folder as the .md file).",
			)
			.addText((text) =>
				text
					.setPlaceholder("e.g. Exports/PDF")
					.setValue(this.plugin.settings.exportFolder)
					.onChange(async (value) => {
						this.plugin.settings.exportFolder = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Open PDF after export")
			.setDesc("Open the written PDF in Obsidian when export finishes.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.openAfterExport)
					.onChange(async (value) => {
						this.plugin.settings.openAfterExport = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Overwrite existing PDF")
			.setDesc(
				"If a PDF with the same name already exists, replace it without asking.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.overwriteExisting)
					.onChange(async (value) => {
						this.plugin.settings.overwriteExisting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
