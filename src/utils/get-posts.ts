import { MarkdownInstance } from "astro";

export const getPosts = async (): Promise<MarkdownInstance<any>[]> => {
    return (await Promise.all(
        Object.values(import.meta.glob("../content/**/post.md")).map((fn) => fn())
    )) as MarkdownInstance<any>[];
};
