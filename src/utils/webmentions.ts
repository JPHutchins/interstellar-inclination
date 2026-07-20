import rawCache from "../data/webmentions.json";

export type WebmentionAuthor = {
	readonly name?: string;
	readonly photo?: string;
	readonly url?: string;
};

export type WebmentionContent = {
	readonly html?: string;
	readonly text?: string;
};

export type WmProperty =
	| "in-reply-to"
	| "mention-of"
	| "like-of"
	| "repost-of"
	| "bookmark-of"
	| "rsvp";

export type WebmentionEntry = {
	readonly "wm-id": number;
	readonly "wm-target": string;
	readonly "wm-property": WmProperty;
	readonly "wm-source"?: string;
	readonly "wm-received"?: string;
	readonly url?: string;
	readonly published?: string | null;
	readonly author?: WebmentionAuthor;
	readonly content?: WebmentionContent | string;
};

export type PostResponses = {
	readonly replies: readonly WebmentionEntry[];
	readonly likes: readonly WebmentionEntry[];
	readonly reposts: readonly WebmentionEntry[];
	readonly count: number;
};

const allWebmentions: readonly WebmentionEntry[] = ((
	rawCache as { webmentions?: readonly unknown[] }
).webmentions ?? []) as readonly WebmentionEntry[];

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

const receivedTime = (entry: WebmentionEntry): number =>
	globalThis.Date.parse(entry["wm-received"] ?? entry.published ?? "") || 0;

const uniqueByAuthor = (entries: readonly WebmentionEntry[]): readonly WebmentionEntry[] => [
	...new Map(
		entries.map((e) => [e.author?.url ?? e["wm-source"] ?? String(e["wm-id"]), e]),
	).values(),
];

export const responsesFor = (postUrl: string): PostResponses => {
	const target = normalizeUrl(postUrl);
	const mine = allWebmentions.filter((w) => normalizeUrl(w["wm-target"]) === target);
	const replies = mine
		.filter((w) => w["wm-property"] === "in-reply-to" || w["wm-property"] === "mention-of")
		.sort((a, b) => receivedTime(a) - receivedTime(b));
	const likes = uniqueByAuthor(mine.filter((w) => w["wm-property"] === "like-of"));
	const reposts = uniqueByAuthor(mine.filter((w) => w["wm-property"] === "repost-of"));
	return {
		replies,
		likes,
		reposts,
		count: replies.length + likes.length + reposts.length,
	};
};

export const contentHtml = (entry: WebmentionEntry): string | undefined =>
	typeof entry.content === "string" ? entry.content : entry.content?.html;

export const contentText = (entry: WebmentionEntry): string | undefined =>
	typeof entry.content === "string" ? undefined : entry.content?.text;

type Network = "bluesky" | "fediverse";

const networkLabel: Readonly<Record<Network, string>> = {
	bluesky: "Bluesky",
	fediverse: "the fediverse",
};

const networkOf = (entry: WebmentionEntry): Network | null => {
	const haystack = `${entry["wm-source"] ?? ""} ${entry.url ?? ""}`;
	if (/bsky|bluesky/i.test(haystack)) return "bluesky";
	if (/brid\.gy/i.test(haystack)) return "fediverse";
	return null;
};

export const authorName = (entry: WebmentionEntry): string => {
	const name = entry.author?.name?.trim();
	if (name) return name;
	const net = networkOf(entry);
	return net ? `Someone on ${networkLabel[net]}` : "Someone";
};

export const responseLink = (entry: WebmentionEntry): string | undefined =>
	entry.author?.url?.trim() || entry.url || entry["wm-source"];

export const publishedAt = (entry: WebmentionEntry): string | undefined =>
	entry.published?.trim() || entry["wm-received"];

export const fediverseThreadFor = (postUrl: string): string | undefined => {
	const reply = responsesFor(postUrl).replies.find((e) => networkOf(e) === "fediverse");
	return reply?.url ?? reply?.["wm-source"];
};
