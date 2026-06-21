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
	fediverseHandle: "@crumpledpaper.tech@web.brid.gy",
	fediverseProfileUrl: "https://fed.brid.gy/web/crumpledpaper.tech",
	blueskyHandle: "crumpledpaper.tech",
	blueskyProfileUrl: "https://bsky.app/profile/crumpledpaper.tech",
	giscus: {
		repo: "JPHutchins/interstellar-inclination",
		repoId: "R_kgDONsP9iA",
		category: "Announcements",
		categoryId: "DIC_kwDONsP9iM4C_nmP",
	},
};

export const webmentionEndpoint = (domain: string): string =>
	`https://webmention.io/${domain}/webmention`;

export const pingbackEndpoint = (domain: string): string =>
	`https://webmention.io/${domain}/xmlrpc`;
