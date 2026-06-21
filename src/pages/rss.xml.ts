import type { APIContext } from "astro";
import { buildFeed } from "src/utils/feed";

export async function GET(context: APIContext): Promise<Response> {
	const feed = await buildFeed(context.site!);
	return new Response(feed.rss2(), {
		headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
	});
}
