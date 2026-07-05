---
title: Posting to Bluesky from Mastodon using Bridgy
author: JP Hutchins
date: 2026-07-04
tags: [TIL, indieweb, fediverse, "Bridgy Fed"]
preview: |
    Today I learned how to have a post on Mastodon "echo" on Bluesky via Bridgy
---

I recently got this blog's posts to be _federated_ so that users on the Fediverse - at least Bluesky + Mastodon - can [comment on my blog posts](/2026-06-21-hello-fediverse). To restate my understanding of how the internet tubes are working here (could be wrong!):

1. I publish a blog post.
2. [Bridgy Fed](https://fed.brid.gy/) _federates_ it to Bridgy-managed Bluesky & Mastodon accounts associated with crumpledpaper.tech. I do not _log in_ or do anything manually with these accounts.
   - 🦋 Bluesky: https://bsky.app/profile/crumpledpaper.tech.web.brid.gy
   - 🦣 Mastodon: https://mastodon.social/@crumpledpaper.tech@web.brid.gy
3. Bluesky and Mastodon users can post a comment on my blog post by replying to the federated post. My blog's comment section links to them (I think I still need to link to Mastodon). When someone comments on the federated Bluesky or Mastodon post, my blog will pick it up and add it to the comments section. After maybe 5-10 minutes.

## Social Media

OK great, but I am also interested in starting to personally post to Mastodon or Bluesky. Using the Fediverse, I don't have to choose! I only have a Mastodon account, and when I post from it, those posts are federated to Bluesky.

If that sounds too good to be true, or at least interesting, then I recommend that you start with this great [series of articles from the EFF](https://www.eff.org/deeplinks/2022/11/leaving-twitters-walled-garden). But I'll explain my small experience testing my new Mastodon account:

1. I publish a [post from my personal Mastodon](https://mastodon.social/@jphutchins/116836487154165882).
2. Bridgy Fed federates it to a Bridgy-managed [Bluesky account](https://bsky.app/profile/jphutchins.mastodon.social.ap.brid.gy/post/3mphuflzlybn2). Note that this is different than the Bridgy-managed accounts associated with crumpledpaper.tech.
3. When someone on Bluesky replies, it federates back to my Mastodon. Meaning that my Mastodon account can interact with un-bridged Bluesky accounts.
4. More fediverse networks could be added?

So that's how it's going so far! It seems to be working as expected and I am incredibly impressed by - and grateful for - the work that has gone into the Fediverse infrastructure that is making this possible.