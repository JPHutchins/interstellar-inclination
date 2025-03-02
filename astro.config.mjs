// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkDirective from "remark-directive";
import rehypeAside from "./src/utils/rehype-aside.ts";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    site: "https://www.crumpledpaper.tech",
    integrations: [
        mdx(),
        sitemap({
            filter: (page) => page.search("draft-") === -1,
        }),
    ],
    markdown: {
        remarkPlugins: [
            remarkGfm,
            remarkDirective,
            remarkMath,
            [remarkToc, { heading: "Table of Contents", maxDepth: 3 }],
        ],
        gfm: true,
        rehypePlugins: [
            rehypeAside,
            rehypeKatex,
            rehypeSlug,
            [
                rehypeAutolinkHeadings,
                {
                    behavior: "prepend",
                    content: {
                        type: "text",
                        value: "#",
                    },
                    headingProperties: {
                        className: ["anchor"],
                    },
                    properties: {
                        className: ["anchor-link"],
                    },
                },
            ],
        ],
    },
});
