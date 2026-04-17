import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "ul", "ol", "li", "a"];
const ALLOWED_ATTR = ["href"];

export function sanitizeHtml(dirty: string): string {
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  // Force rel and target on all anchor tags
  return clean.replace(
    /<a\s/g,
    '<a rel="noopener noreferrer" target="_blank" '
  );
}
