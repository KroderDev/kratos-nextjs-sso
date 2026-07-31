import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const docPath = join(currentDir, "indexing.md");
const robotsPath = join(currentDir, "..", "app", "robots.ts");

const doc = readFileSync(docPath, "utf-8");

/** Extracts the contents of the first ```ts fenced code block in a markdown string. */
function extractFirstTsCodeBlock(markdown: string): string {
  const match = markdown.match(/```ts\n([\s\S]*?)```/);
  if (!match) {
    throw new Error("No ```ts code block found in markdown");
  }
  return match[1].trim();
}

describe("docs/indexing.md", () => {
  it("links to the actual app/robots.ts source file", () => {
    expect(doc).toContain("[`robots.ts`](../app/robots.ts)");
    expect(() => readFileSync(robotsPath, "utf-8")).not.toThrow();
  });

  it("documents the default policy as blocking all crawling", () => {
    expect(doc).toMatch(/blocks all search-engine\s+crawling/);
  });

  it("includes an Implementation section whose snippet matches app/robots.ts behavior", () => {
    const implementationSnippet = extractFirstTsCodeBlock(doc);
    const actualSource = readFileSync(robotsPath, "utf-8");

    // Both the documented snippet and the real file must declare the same
    // default-deny rule so the docs cannot silently drift from the code.
    expect(implementationSnippet).toContain('userAgent: "*"');
    expect(implementationSnippet).toContain('disallow: "/"');
    expect(actualSource).toContain('userAgent: "*"');
    expect(actualSource).toContain('disallow: "/"');
  });

  it("documents how to make the landing page indexable while excluding sensitive routes", () => {
    const codeBlocks = [...doc.matchAll(/```ts\n([\s\S]*?)```/g)].map((m) => m[1]);
    expect(codeBlocks).toHaveLength(2);

    const [, landingPageSnippet] = codeBlocks;
    expect(landingPageSnippet).toContain('"/auth/"');
    expect(landingPageSnippet).toContain('"/dashboard/"');
    expect(landingPageSnippet).toContain('"/api/"');
    expect(landingPageSnippet).not.toContain('disallow: "/"');
  });

  it("references the official Next.js robots file convention docs", () => {
    expect(doc).toContain(
      "https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots",
    );
  });
});