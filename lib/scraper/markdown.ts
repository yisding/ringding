import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// Remove scripts, styles, and other non-content elements
turndown.remove(["script", "style", "noscript", "iframe"]);

const MAX_CHARS = 100_000; // ~25k tokens

export function htmlToMarkdown(html: string): string {
  const markdown = turndown.turndown(html);

  if (markdown.length > MAX_CHARS) {
    return markdown.slice(0, MAX_CHARS) + "\n\n[...truncated]";
  }

  return markdown;
}
