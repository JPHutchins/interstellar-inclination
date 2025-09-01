type MarkdownInstance = import("astro").MarkdownInstance<any>;
import { createHash } from "crypto";
const { MODE } = import.meta.env;

export type Post = {
	title: string;
	author: string;
	slug: string;
	preview: string;
	timestamp: number;
	draft: boolean;
	date: string;
	file: URL;
	Content: string;
	icon?: string;
	emoji?: string;
};

function obfuscatedPath(str: string): string {
	return `draft-${createHash("sha256").update(str).digest("hex")}`;
}

const isDraft = (post: MarkdownInstance): boolean => post.file.split("/").reverse()[2] === "drafts";

const singlePublished = (post: MarkdownInstance): Post => ({
	...post.frontmatter,
	Content: post.Content,
	slug:
		MODE === "development" && isDraft(post)
			? obfuscatedPath(post.file)
			: post.file.split("/").reverse()[1],
	draft: isDraft(post),
	timestamp: new Date(post.frontmatter.date).valueOf(),
});

export const published = (posts: MarkdownInstance[]): Post[] =>
	posts
		.filter((post) => post.frontmatter.title)
		.map((post) => singlePublished(post))
		.filter((post) => MODE === "development" || !post.draft)
		.sort((a, b) => b.timestamp - a.timestamp);

const singleDrafted = (post: MarkdownInstance): Post => ({
	...post.frontmatter,
	Content: post.Content,
	slug: obfuscatedPath(post.file),
	draft: isDraft(post),
	timestamp: new Date(post.frontmatter.date).valueOf(),
});

export const drafted = (posts: MarkdownInstance[]): Post[] =>
	posts
		.filter((post) => post.frontmatter.title)
		.map((post) => singleDrafted(post))
		.filter((post) => post.draft)
		.sort((a, b) => b.timestamp - a.timestamp);

export function getRSS(posts: MarkdownInstance[]) {
	return {
		title: "Simple Blog RSS",
		description: "Simple Blog RSS Feed",
		stylesheet: true,
		customData: `<language>en-us</language>`,
		items: published(posts).map((post: Post) => ({
			title: post.title,
			description: post.preview,
			link: post.slug,
			pubDate: post.date,
		})),
	};
}
