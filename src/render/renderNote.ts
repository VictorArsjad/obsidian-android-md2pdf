import { App, Component, MarkdownRenderer, TFile } from "obsidian";
import { PRINT_CSS, RENDER_WIDTH_PX } from "../pdf/printCss";

export interface RenderedNote {
	host: HTMLElement;
	root: HTMLElement;
	styleEl: HTMLStyleElement;
	component: Component;
}

/**
 * Render a note into an offscreen container with print CSS.
 * Caller must invoke cleanupRenderedNote when finished.
 */
export async function renderNoteToDom(
	app: App,
	file: TFile,
): Promise<RenderedNote> {
	const component = new Component();
	component.load();

	const styleEl = document.createElement("style");
	styleEl.setAttribute("data-android-md-pdf", "print-css");
	styleEl.textContent = PRINT_CSS;
	document.head.appendChild(styleEl);

	const host = document.body.createDiv({ cls: "android-md-pdf-host" });
	host.style.cssText = [
		"position: fixed",
		"left: -10000px",
		"top: 0",
		`width: ${RENDER_WIDTH_PX}px`,
		"max-width: " + RENDER_WIDTH_PX + "px",
		"background: #ffffff",
		"color: #000000",
		"overflow: visible",
		"pointer-events: none",
		"z-index: -1",
	].join(";");

	const root = host.createDiv({ cls: "android-md-pdf-root markdown-preview-view markdown-rendered" });
	root.style.width = "100%";

	const markdown = await app.vault.read(file);
	await MarkdownRenderer.render(app, markdown, root, file.path, component);

	// Allow layout / embed resolution to settle.
	await waitFrames(2);

	return { host, root, styleEl, component };
}

export function cleanupRenderedNote(rendered: RenderedNote): void {
	try {
		rendered.component.unload();
	} catch {
		/* ignore */
	}
	rendered.host.remove();
	rendered.styleEl.remove();
}

function waitFrames(count: number): Promise<void> {
	return new Promise((resolve) => {
		const step = (left: number) => {
			if (left <= 0) {
				resolve();
				return;
			}
			requestAnimationFrame(() => step(left - 1));
		};
		step(count);
	});
}
