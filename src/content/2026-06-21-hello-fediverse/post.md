---
title: Static Blog Comments
author: JP Hutchins
date: 2026-06-21
tags: [TIL, webmentions, indieweb, fediverse, "Bridgy Fed"]
preview: |
    Today I learned how to setup fediverse webmentions + giscus comments
---

I had read about [IndieWeb](https://indieweb.org/), [webmentions](https://webmention.io/), and [Fediverse](https://en.wikipedia.org/wiki/Fediverse) a few years ago and was very excited about it! It's a monumental under taking and a great example of good (read: ethical) tech.

But I am not a web developer 🤣, and while I can appreciate what the engineers have accomplished, I was never too sure how to get it going, end-to-end.

I've been burning quite a few tokens while LLMs are still basically "free" ([see shellac's analysis](https://she-llac.com/claude-limits?ref=wheresyoured.at)), so I decided to let Claude Code slop together a plan from the following resources, particularly the [posts by engineers](#updating-webmentions-on-a-static-site) that have implemented for their own static sites.

You can see this site's [source](https://github.com/JPHutchins/interstellar-inclination) to see how the implementation went. I suppose it's not tested until this post goes live and I see it federated.

Update: it's working!

> [!WARNING] LLM Disclosure
>
> The following citations were assembled from the same `claude-opus-4-8` context that provided the webmentions + giscus implementation for this blog. The implementation is the result of my feeding in a subset of those articles and iterating until I approved the design and eventually the implementation itself.

## Bridgy Fed & federation
- [Bridgy Fed docs](https://fed.brid.gy/docs)
- [bridgy-fed FEDERATION.md](https://github.com/snarfed/bridgy-fed/blob/main/FEDERATION.md)
- [snarfed/bridgy-fed](https://github.com/snarfed/bridgy-fed)
- [IndieWeb: Bridgy Fed](https://indieweb.org/Bridgy_Fed)

## Webmentions (receiving replies)
- [webmention.io](https://webmention.io/)
- [webmention.io API README](https://github.com/aaronpk/webmention.io)
- [webmention.io #126 — avatar rehosting](https://github.com/aaronpk/webmention.io/issues/126)
- [IndieWeb: Webmention](https://indieweb.org/Webmention)

## Updating webmentions on a static site
- [Nicolas Hoizey — Updating webmentions on a static site](https://nicolas-hoizey.com/articles/2023/02/05/updating-webmentions-on-a-static-site/)
- [Sebastian De Deyne — Webmentions with GitHub Actions](https://sebastiandedeyne.com/webmentions-on-a-static-site-with-github-actions/)
- [Max Böck — Using webmentions on static sites](https://mxb.dev/blog/using-webmentions-on-static-sites/)
- [Jan Monschke — Adding webmentions to your static blog](https://janmonschke.com/adding-webmentions-to-your-static-blog/)

## Microformats2 (h-card / h-entry / h-feed)
- [representative h-card (indieweb)](https://indieweb.org/representative_h-card)
- [representative h-card (microformats.org)](https://microformats.org/wiki/representative-h-card)
- [h-entry](https://indieweb.org/h-entry)
- [h-feed](https://indieweb.org/h-feed)
- [h-card](https://indieweb.org/h-card)

## Bluesky / AT Protocol (custom-handle verification)
- [com.atproto.identity.resolveHandle](https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle)
- [PLC Directory](https://plc.directory/)
- [app.bsky.feed.getAuthorFeed](https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed)

## Feed discovery
- [Astro RSS recipe](https://docs.astro.build/en/recipes/rss/)
- [feed (jpmonette/feed)](https://github.com/jpmonette/feed)

## Refresh-workflow plumbing
- [GITHUB_TOKEN no-recursion rule](https://docs.github.com/en/actions/concepts/security/github_token)
- [actions/checkout #1550 — sparse-checkout](https://github.com/actions/checkout/issues/1550)
- [community #25702 — push-from-action triggering](https://github.com/orgs/community/discussions/25702)

## GitHub-comments fallback & safety
- [giscus](https://github.com/giscus/giscus)
- [giscus ADVANCED-USAGE (theme postMessage)](https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md)
- [sanitize-html](https://www.npmjs.com/package/sanitize-html)

## Landscape / inspiration
- [Cassidy James — Mastodon-powered blog comments](https://cassidyjames.com/blog/fediverse-blog-comments-mastodon/)
- [Greg Newman — Mastodon comments in Astro](https://gregnewman.io/blog/mastodon-comments-in-astrojs/)
- [zerok/retoots](https://github.com/zerok/retoots)
- [Dan MacKinlay — Comment systems for static websites](https://danmackinlay.name/notebook/static_site_comments.html)
- [Darek Kay — Static site comments](https://darekkay.com/blog/static-site-comments/)
