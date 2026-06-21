import sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
	allowedTags: [
		"p",
		"br",
		"a",
		"em",
		"strong",
		"b",
		"i",
		"code",
		"pre",
		"blockquote",
		"ul",
		"ol",
		"li",
		"span",
	],
	allowedAttributes: {
		a: ["href", "rel"],
		span: ["class"],
	},
	allowedSchemes: ["http", "https", "mailto"],
	allowedSchemesAppliedToAttributes: ["href"],
	disallowedTagsMode: "discard",
	transformTags: {
		a: (_tagName, attribs) => ({
			tagName: "a",
			attribs: { ...attribs, rel: "nofollow ugc noopener", target: "_blank" },
		}),
	},
};

export const sanitizeWebmentionHtml = (dirty: string): string => sanitizeHtml(dirty, options);
