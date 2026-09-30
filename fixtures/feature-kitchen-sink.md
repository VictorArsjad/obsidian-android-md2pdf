# Kitchen sink (PDF export fixture)

Paragraph one. Spacing after this paragraph should look close to desktop Export to PDF.

Paragraph two with **bold**, *italic*, and a [[Sample Note|wikilink as text]].

---

## Lists

- First item
- Second item with `inline code`
	- Nested item
1. Ordered one
2. Ordered two

## Callout

> [!note] Note title
> Callout body line. Should keep left bar and readable spacing.

## Table

| Column A | Column B |
| --- | --- |
| Alpha | 1 |
| Beta | 2 |

## Code

```ts
export function hello(name: string): string {
  return `Hello, ${name}`;
}
```

## Footnotes

Here is a footnote reference.[^1]

[^1]: Footnote definition text for export QA.

## Image

If present in the vault, an image embed would go here:

<!-- ![[example.png]] -->
