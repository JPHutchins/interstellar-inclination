#!/usr/bin/env node
// @ts-check
// Zero-dependency updater for the post→Bluesky-thread map. Node 22+, native fetch.
// Bridgy Fed mirrors each published post as a Bluesky post under the blog's
// bridged account; that post embeds the original blog URL (embed.external.uri).
// This reads the bridged repo, maps blog URL → Bluesky thread URL, and writes a
// deterministic file so each post can render a "Discuss on Bluesky" link.
// Emits `changed=true|false` to GITHUB_OUTPUT so the workflow can gate the commit.

import { appendFile, readFile, writeFile } from "node:fs/promises";

const HANDLE = process.env.BLUESKY_HANDLE ?? "crumpledpaper.tech";
const CACHE_PATH = process.env.BLUESKY_LINKS_CACHE ?? "src/data/bluesky-posts.json";
const APPVIEW = "https://public.api.bsky.app/xrpc";

/** Canonical key for a blog URL: drop scheme/www/trailing-slash so lookups match. */
const normalizeUrl = (raw) => {
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

const getJson = async (url) => {
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(`${url} → ${res.status}: ${await res.text()}`);
	return res.json();
};

const resolveDid = async (handle) =>
	(await getJson(`${APPVIEW}/com.atproto.identity.resolveHandle?handle=${handle}`)).did;

/** The bridged repo lives on Bridgy's PDS; read its endpoint from the DID doc. */
const resolvePds = async (did) => {
	const doc = await getJson(`https://plc.directory/${did}`);
	const svc = (doc.service ?? []).find((s) => s.type === "AtprotoPersonalDataServer");
	if (!svc?.serviceEndpoint) throw new Error(`no PDS in DID doc for ${did}`);
	return svc.serviceEndpoint;
};

/** All feed-post records in the repo, paging by cursor (feed views drop link-only posts). */
const listPosts = async (pds, did) => {
	const collect = async (cursor, acc) => {
		const url = new URL(`${pds}/xrpc/com.atproto.repo.listRecords`);
		url.searchParams.set("repo", did);
		url.searchParams.set("collection", "app.bsky.feed.post");
		url.searchParams.set("limit", "100");
		if (cursor) url.searchParams.set("cursor", cursor);
		const body = await getJson(url);
		const records = Array.isArray(body.records) ? body.records : [];
		const next = acc.concat(records);
		return body.cursor && records.length ? collect(body.cursor, next) : next;
	};
	return collect(undefined, []);
};

const rkeyOf = (uri) => uri.split("/").pop() ?? "";

/**
 * Map normalized blog URL → Bluesky thread URL. A post may be bridged more than
 * once (e.g. pinged under /slug and /slug/); keep the earliest by rkey (a TID,
 * so lexicographic order is chronological) for a stable, canonical link.
 */
const buildLinks = (records, handle) => {
	const byUrl = new Map();
	for (const rec of records) {
		const ext = rec.value?.embed?.external?.uri;
		if (!ext) continue;
		const key = normalizeUrl(ext);
		if (key.replace(/^https:\/\//, "").split("/")[0] !== "crumpledpaper.tech") continue;
		const rkey = rkeyOf(rec.uri);
		const prev = byUrl.get(key);
		if (!prev || rkey < prev) byUrl.set(key, rkey);
	}
	return Object.fromEntries(
		[...byUrl.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([url, rkey]) => [url, `https://bsky.app/profile/${handle}/post/${rkey}`]),
	);
};

const setOutput = async (changed) => {
	const file = process.env.GITHUB_OUTPUT;
	if (file) await appendFile(file, `changed=${changed}\n`);
};

const readCache = async () => {
	try {
		const parsed = JSON.parse(await readFile(CACHE_PATH, "utf8"));
		return parsed?.links && typeof parsed.links === "object" ? parsed.links : {};
	} catch {
		return {};
	}
};

const main = async () => {
	const did = await resolveDid(HANDLE);
	const pds = await resolvePds(did);
	const links = buildLinks(await listPosts(pds, did), HANDLE);

	const before = JSON.stringify(await readCache());
	const after = JSON.stringify(links);
	if (before === after) {
		console.log(`No Bluesky link changes (${Object.keys(links).length} mapped).`);
		await setOutput(false);
		return;
	}

	await writeFile(CACHE_PATH, `${JSON.stringify({ links }, null, "\t")}\n`, "utf8");
	console.log(`Wrote ${Object.keys(links).length} Bluesky links.`);
	await setOutput(true);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
