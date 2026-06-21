import { Feed } from "feed";
import { published } from "@data/post";
import { getPosts } from "src/utils/get-posts";

const TITLE = "Crumpled Paper";
const DESCRIPTION = "Technical writing on software, firmware, and Python by JP Hutchins.";
const AUTHOR = "JP Hutchins";

export const buildFeed = async (site: URL): Promise<Feed> => {
	const home = site.href;
	const posts = published(await getPosts()).filter((post) => !post.draft);

	const feed = new Feed({
		title: TITLE,
		description: DESCRIPTION,
		id: home,
		link: home,
		language: "en",
		copyright: `© ${new Date().getFullYear()} ${AUTHOR}`,
		updated: posts.length ? new Date(posts[0].date) : new Date(),
		feedLinks: {
			atom: new URL("atom.xml", site).href,
			rss: new URL("rss.xml", site).href,
		},
		author: { name: AUTHOR, link: home },
	});

	for (const post of posts) {
		const url = new URL(post.slug, site).href;
		feed.addItem({
			title: post.title,
			id: url,
			link: url,
			description: post.preview,
			date: new Date(post.date),
			category: post.tags.map((name) => ({ name })),
			author: [{ name: post.author }],
		});
	}

	return feed;
};
