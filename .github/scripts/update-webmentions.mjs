#!/usr/bin/env node
// @ts-check
// Zero-dependency webmention cache updater. Node 22+, native fetch.
// Reads the existing JSON cache, fetches only NEW mentions via `since_id`,
// merges + dedupes by `wm-id`, and writes a deterministic file.
// Emits `changed=true|false` to GITHUB_OUTPUT so the workflow can gate the commit.

import { appendFile, readFile, writeFile } from "node:fs/promises";

const DOMAIN = process.env.WEBMENTION_DOMAIN;
const TOKEN = process.env.WEBMENTION_TOKEN;
const CACHE_PATH = process.env.WEBMENTION_CACHE ?? "src/data/webmentions.json";
const PER_PAGE = 200;

if (!DOMAIN) {
	console.error("WEBMENTION_DOMAIN is required");
	process.exit(1);
}

if (!TOKEN) {
	console.warn("WEBMENTION_TOKEN not set — skipping refresh until configured (see SETUP-COMMENTS.md).");
	process.exit(0);
}

/** @typedef {{ "wm-id": number, [k: string]: unknown }} Mention */
/** @typedef {{ lastWmId: number | null, webmentions: Mention[] }} Cache */

/** @returns {Promise<Cache>} */
const readCache = async () => {
	try {
		const parsed = JSON.parse(await readFile(CACHE_PATH, "utf8"));
		return {
			lastWmId: typeof parsed.lastWmId === "number" ? parsed.lastWmId : null,
			webmentions: Array.isArray(parsed.webmentions) ? parsed.webmentions : [],
		};
	} catch {
		return { lastWmId: null, webmentions: [] };
	}
};

/**
 * Fetch mentions with `wm-id` greater than `sinceId`, paging until drained.
 * @param {number | null} sinceId
 * @returns {Promise<Mention[]>}
 */
const fetchSince = async (sinceId) => {
	const collect = async (page, acc) => {
		const url = new URL("https://webmention.io/api/mentions.jf2");
		url.searchParams.set("domain", /** @type {string} */ (DOMAIN));
		url.searchParams.set("token", /** @type {string} */ (TOKEN));
		url.searchParams.set("per-page", String(PER_PAGE));
		url.searchParams.set("page", String(page));
		if (sinceId != null) url.searchParams.set("since_id", String(sinceId));

		const res = await fetch(url, { headers: { Accept: "application/json" } });
		if (!res.ok) throw new Error(`webmention.io ${res.status}: ${await res.text()}`);

		const body = await res.json();
		const children = Array.isArray(body.children) ? body.children : [];
		return children.length < PER_PAGE
			? acc.concat(children)
			: collect(page + 1, acc.concat(children));
	};
	return collect(0, []);
};

/**
 * Merge + dedupe by `wm-id` (last write wins), sorted ascending for stable diffs.
 * @param {Mention[]} existing
 * @param {Mention[]} incoming
 * @returns {Mention[]}
 */
const mergeDedupe = (existing, incoming) =>
	[...new Map([...existing, ...incoming].map((m) => [m["wm-id"], m])).values()].sort(
		(a, b) => a["wm-id"] - b["wm-id"],
	);

/**
 * Recursively reserialize with sorted object keys so identical content yields
 * byte-identical JSON regardless of API key ordering — clean, churn-free diffs.
 * @param {unknown} value
 * @returns {unknown}
 */
const sortKeys = (value) =>
	Array.isArray(value)
		? value.map(sortKeys)
		: value && typeof value === "object"
			? Object.fromEntries(
					Object.keys(value)
						.sort()
						.map((k) => [
							k,
							sortKeys(/** @type {Record<string, unknown>} */ (value)[k]),
						]),
				)
			: value;

/** @param {Mention[]} mentions */
const maxWmId = (mentions) => mentions.reduce((max, m) => (m["wm-id"] > max ? m["wm-id"] : max), 0);

/** @param {boolean} changed */
const setOutput = async (changed) => {
	const file = process.env.GITHUB_OUTPUT;
	if (file) await appendFile(file, `changed=${changed}\n`);
};

const main = async () => {
	const cache = await readCache();
	const incoming = await fetchSince(cache.lastWmId);
	const merged = mergeDedupe(cache.webmentions, incoming);

	const before = JSON.stringify(sortKeys(cache.webmentions));
	const after = JSON.stringify(sortKeys(merged));

	if (before === after) {
		console.log(`No new webmentions (${merged.length} cached).`);
		await setOutput(false);
		return;
	}

	const next = { lastWmId: maxWmId(merged) || null, webmentions: merged };
	await writeFile(CACHE_PATH, `${JSON.stringify(sortKeys(next), null, "\t")}\n`, "utf8");
	console.log(
		`Wrote ${merged.length} webmentions (+${merged.length - cache.webmentions.length} new).`,
	);
	await setOutput(true);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
