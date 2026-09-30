import { App, TFile, requestUrl } from "obsidian";

const IMAGE_EXTENSIONS = new Set([
	"png",
	"jpg",
	"jpeg",
	"gif",
	"bmp",
	"svg",
	"webp",
	"avif",
]);

/**
 * Normalize the rendered DOM for PDF export:
 * images inlined, wikilinks as text, embeds cleaned, media stripped.
 */
export async function prepareDomForPdf(
	app: App,
	root: HTMLElement,
	sourceFile: TFile,
): Promise<void> {
	await convertInternalImageEmbeds(app, root, sourceFile);
	await inlineImages(app, root, sourceFile);
	flattenWikilinks(root);
	stripUnsupportedMedia(root);
	normalizeFootnotes(root);
	forceReadableTableHeaders(root);
	materializeListMarkers(root);
}

/**
 * Draw list markers as real text inside each li so PDF text export keeps bullets.
 */
function materializeListMarkers(root: HTMLElement): void {
	root.querySelectorAll("ul, ol").forEach((list) => {
		const isOrdered = list.tagName === "OL";
		const items = Array.from(list.children).filter(
			(c): c is HTMLElement =>
				c instanceof HTMLElement && c.tagName === "LI",
		);

		items.forEach((li, index) => {
			if (li.querySelector(":scope > .android-md2pdf-marker")) return;

			li.style.listStyle = "none";
			li.style.display = "block";
			li.style.paddingLeft = "0";
			li.style.marginLeft = "0";

			const marker = document.createElement("span");
			marker.className = "android-md2pdf-marker";
			marker.textContent = isOrdered ? `${index + 1}. ` : "• ";
			marker.style.cssText =
				"display:inline;font-weight:700;margin-right:0.35em;color:#000;";

			// Prefer inserting before first content node.
			const first = li.firstChild;
			if (first) li.insertBefore(marker, first);
			else li.appendChild(marker);
		});

		(list as HTMLElement).style.listStyle = "none";
		(list as HTMLElement).style.paddingLeft = "0.25em";
	});
}

async function convertInternalImageEmbeds(
	app: App,
	root: HTMLElement,
	sourceFile: TFile,
): Promise<void> {
	const embeds = Array.from(
		root.querySelectorAll("span.internal-embed, div.internal-embed"),
	);

	for (const embed of embeds) {
		const src = embed.getAttribute("src");
		if (!src) {
			embed.remove();
			continue;
		}

		const alt = embed.getAttribute("alt") || "";
		const target = resolveVaultFile(app, src, sourceFile);
		if (!target || !IMAGE_EXTENSIONS.has(target.extension.toLowerCase())) {
			// Non-image embed: keep visible title text.
			const text = document.createElement("span");
			text.textContent = alt || src;
			embed.replaceWith(text);
			continue;
		}

		const img = document.createElement("img");
		img.alt = alt || target.basename;
		img.setAttribute("data-vault-path", target.path);
		embed.replaceWith(img);
	}
}

async function inlineImages(
	app: App,
	root: HTMLElement,
	sourceFile: TFile,
): Promise<void> {
	const images = Array.from(root.querySelectorAll("img"));

	for (const img of images) {
		const vaultPath = img.getAttribute("data-vault-path");
		const src = vaultPath || img.getAttribute("src") || "";
		if (!src || src.startsWith("data:")) continue;

		try {
			if (/^https?:\/\//i.test(src)) {
				const res = await requestUrl({ url: src });
				const mime = guessMimeFromUrl(src, res.arrayBuffer);
				img.src = arrayBufferToDataUrl(res.arrayBuffer, mime);
				continue;
			}

			const file =
				(vaultPath
					? app.vault.getAbstractFileByPath(vaultPath)
					: null) || resolveVaultFile(app, src, sourceFile);

			if (!(file instanceof TFile)) continue;

			const binary = await app.vault.readBinary(file);
			const mime = mimeFromExtension(file.extension);
			img.src = arrayBufferToDataUrl(binary, mime);
			img.removeAttribute("data-vault-path");
		} catch (error) {
			console.warn("[Android MD2PDF] Failed to inline image", src, error);
		}
	}
}

function flattenWikilinks(root: HTMLElement): void {
	const links = Array.from(
		root.querySelectorAll("a.internal-link, a[data-href]"),
	);

	for (const link of links) {
		const text = (link.textContent || "").trim();
		const span = document.createElement("span");
		span.className = "android-md2pdf-wikilink";
		span.textContent = text || link.getAttribute("data-href") || "";
		link.replaceWith(span);
	}
}

function stripUnsupportedMedia(root: HTMLElement): void {
	root
		.querySelectorAll("video, audio, iframe, canvas, object, embed")
		.forEach((el) => {
			const placeholder = document.createElement("p");
			placeholder.textContent = `[${el.tagName.toLowerCase()} omitted]`;
			el.replaceWith(placeholder);
		});

	root
		.querySelectorAll(
			".edit-block-button, .markdown-embed-link, .file-embed-link, button",
		)
		.forEach((el) => el.remove());
}

function normalizeFootnotes(root: HTMLElement): void {
	// Obsidian already renders footnotes; ensure backrefs do not look like UI chrome.
	root.querySelectorAll(".footnote-backref").forEach((el) => {
		(el as HTMLElement).style.display = "none";
	});
}

/** Obsidian themes often mute thead text; force black for print capture. */
function forceReadableTableHeaders(root: HTMLElement): void {
	root.querySelectorAll("th, thead td").forEach((el) => {
		const cell = el as HTMLElement;
		cell.style.color = "#000000";
		cell.style.setProperty("-webkit-text-fill-color", "#000000");
		cell.style.opacity = "1";
		cell.style.backgroundColor = "#f2f2f2";
		cell.style.fontWeight = "700";
	});
	root.querySelectorAll("td").forEach((el) => {
		const cell = el as HTMLElement;
		cell.style.color = "#000000";
		cell.style.setProperty("-webkit-text-fill-color", "#000000");
	});
}

function resolveVaultFile(
	app: App,
	linkPath: string,
	sourceFile: TFile,
): TFile | null {
	const cleaned = linkPath.split("|")[0].split("#")[0].trim();
	const dest = app.metadataCache.getFirstLinkpathDest(cleaned, sourceFile.path);
	return dest instanceof TFile ? dest : null;
}

function mimeFromExtension(ext: string): string {
	switch (ext.toLowerCase()) {
		case "png":
			return "image/png";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "gif":
			return "image/gif";
		case "webp":
			return "image/webp";
		case "svg":
			return "image/svg+xml";
		case "bmp":
			return "image/bmp";
		case "avif":
			return "image/avif";
		default:
			return "application/octet-stream";
	}
}

function guessMimeFromUrl(url: string, _buffer: ArrayBuffer): string {
	const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
	return mimeFromExtension(ext);
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mime: string): string {
	const bytes = new Uint8Array(buffer);
	const chunk = 0x8000;
	let binary = "";
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return `data:${mime};base64,${btoa(binary)}`;
}
