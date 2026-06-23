import rawLinks from "../data/bluesky-posts.json";

const links: Readonly<Record<string, string>> =
	(rawLinks as { links?: Record<string, string> }).links ?? {};

const normalizeUrl = (raw: string): string => {
	try {
		const u = new URL(raw);
		u.protocol = "https:";
		u.hostname = u.hostname.replace(/^www\./, "").toLowerCase();
		u.hash = "";
		u.search = "";
		if (u.port === "80" || u.port === "443") u.port = "";
		u.pathname = u.pathname.replace(/\/+$/, "") || "/";
		return u.toString();
	} catch {
		return raw;
	}
};

export const blueskyUrlFor = (postUrl: string): string | undefined => links[normalizeUrl(postUrl)];
