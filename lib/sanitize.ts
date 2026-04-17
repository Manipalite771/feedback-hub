import sanitize from "sanitize-html";

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "a"],
    allowedAttributes: {
      a: ["href"],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    },
  });
}
