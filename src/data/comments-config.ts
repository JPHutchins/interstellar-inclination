export type GiscusConfig = {
	readonly repo: `${string}/${string}`;
	readonly repoId: string;
	readonly category: string;
	readonly categoryId: string;
};

export type CommentsConfig = {
	readonly webmentionDomain: string;
	readonly fediverseHandle: string;
	readonly fediverseProfileUrl: string;
	readonly blueskyHandle: string;
	readonly blueskyProfileUrl: string;
	readonly giscus: GiscusConfig;
};

export const commentsConfig: CommentsConfig = {
	webmentionDomain: "www.crumpledpaper.tech",
	fediverseHandle: "@www.crumpledpaper.tech@web.brid.gy",
	fediverseProfileUrl: "https://web.brid.gy/web/www.crumpledpaper.tech",
	blueskyHandle: "www.crumpledpaper.tech.web.brid.gy",
	blueskyProfileUrl: "https://bsky.app/profile/www.crumpledpaper.tech.web.brid.gy",
	giscus: {
		repo: "JPHutchins/interstellar-inclination",
		repoId: "REPLACE_WITH_REPO_ID",
		category: "Comments",
		categoryId: "REPLACE_WITH_CATEGORY_ID",
	},
};

export const webmentionEndpoint = (domain: string): string =>
	`https://webmention.io/${domain}/webmention`;
