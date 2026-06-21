# Comments setup — Webmentions + Bridgy Fed, with a Giscus fallback

This blog accepts responses through **two clearly-labeled channels** in a single
"Responses" section under each post:

1. **Fediverse + Bluesky** — readers reply from Mastodon/the fediverse/Bluesky.
   Those replies (and likes/reposts) come back as **webmentions** (via Bridgy Fed →
   webmention.io) and are rendered statically at build time.
2. **GitHub** — readers comment with their GitHub account via **Giscus**
   (GitHub Discussions).

No server, no database. The site stays static and portable. Everything below is the
**one-time external setup**; the code is already in the repo.

---

## How it fits together

```
 reader on Mastodon/Bluesky ──reply──► Bridgy Fed ──webmention──► webmention.io (stores)
                                                                         │
   .github/workflows/webmentions.yaml (cron, every 30 min)              │ JF2 API
     └─ .github/scripts/update-webmentions.mjs ──fetch since_id────────►┘
          └─ writes src/data/webmentions.json ──commit+push──► deploy rebuild
                                                                         │
 astro build reads src/data/webmentions.json ──► <Responses> renders replies + Giscus
```

- **Federation is feed-based.** Bridgy Fed discovers and federates posts by polling
  `/rss.xml` (and `/atom.xml`). We do **not** send outbound webmentions to Bridgy Fed.
    > ⚠️ Do not send Bridgy Fed a webmention. The moment you do, it stops reading your
    > RSS/Atom feed and expects a webmention for **every** future post. Staying on the
    > feed path keeps this zero-maintenance. (Receiving inbound webmentions at
    > webmention.io is fine — that's how replies get back and does not trigger the switch.)
- The **site build never calls the webmention.io API.** It reads the committed
  `src/data/webmentions.json`. The scheduled job is the only thing that talks to the API.

---

## 1. webmention.io (receive replies)

1. Go to <https://webmention.io> and sign in with your domain **`www.crumpledpaper.tech`**
   (IndieAuth verifies you via the `rel="me"` link to GitHub in the footer — your GitHub
   profile must link back to the site).
    - The domain you register **must match** the canonical post URLs (which use `www.`),
      because matching is done on the webmention `wm-target`.
2. Copy your **API token** from the dashboard.
3. Add it as a GitHub Actions repo secret named **`WEBMENTION_IO_TOKEN`**
   (Settings → Secrets and variables → Actions → New repository secret).

The receiving endpoint `https://webmention.io/www.crumpledpaper.tech/webmention` is
already advertised in the page `<head>` (see `src/components/layouts/blog.astro`).

## 2. Bridgy Fed (bridge fediverse + Bluesky)

1. Go to <https://fed.brid.gy/web-site>, enter `www.crumpledpaper.tech`, and connect.
2. Your bridged handles become:
    - Fediverse: **`@www.crumpledpaper.tech@web.brid.gy`**
    - Bluesky: **`www.crumpledpaper.tech.web.brid.gy`**
3. Verify the profile URLs in `src/data/comments-config.ts`
   (`fediverseProfileUrl` / `blueskyProfileUrl`) point where you expect, and adjust if
   Bridgy Fed shows a different profile URL. These power the "Reply as …" call-to-action.

Federation is automatic from there: Bridgy Fed periodically polls `/rss.xml`, bridges new
posts, and routes replies back to webmention.io.

> **Optional, advanced — instant federation.** If you ever want posts to federate
> immediately instead of on Bridgy Fed's poll, you'd add an `h-entry` link to
> `https://fed.brid.gy/` and send a webmention on publish. This opts you into the
> webmention lane permanently (see the warning above). Not recommended unless you need it.

## 3. Giscus (GitHub comments)

1. On the **public** repo `JPHutchins/interstellar-inclination`:
    - Settings → General → Features → enable **Discussions**.
    - Create a Discussions category, e.g. **"Comments"** (type: Announcement, so only you
      open threads; anyone can still reply).
2. Install the **giscus GitHub App** (<https://github.com/apps/giscus>) and grant it the repo.
3. Open <https://giscus.app>, enter the repo, pick the category, and copy the generated
   **`data-repo-id`** (`R_…`) and **`data-category-id`** (`DIC_…`).
4. Paste them into `src/data/comments-config.ts`:
    ```ts
    export const commentsConfig: CommentsConfig = {
    	// ...other fields...
    	giscus: {
    		repo: "JPHutchins/interstellar-inclination",
    		repoId: "R_…", // from giscus.app
    		category: "Comments",
    		categoryId: "DIC_…", // from giscus.app
    	},
    };
    ```
    Until these are filled in, the GitHub channel shows a "not configured yet" note instead
    of the widget. Theme (light/dark) syncs automatically with the site toggle.

## 4. Deploy workflow

No change needed. `.github/workflows/deploy.yaml` already builds on push to `main` and
declares `workflow_dispatch`. The refresh job (`.github/workflows/webmentions.yaml`) pushes
the updated cache and then dispatches a build — because a push made with the default
`GITHUB_TOKEN` does not, by GitHub's rule, trigger the deploy on its own.

> **Alternative to the explicit dispatch:** push the data commit with a **deploy key**
> (or fine-grained PAT) instead of `GITHUB_TOKEN`. That push _does_ trigger `deploy.yaml`
> directly, so you can drop the `gh workflow run` line. It costs one extra secret; the
> dispatch approach used here costs none.

---

## Verify end-to-end

1. **Local build:** `npm run build`, then confirm the feeds exist and exclude drafts:
    ```sh
    test -f dist/rss.xml && test -f dist/atom.xml
    ! grep -q "draft-" dist/rss.xml dist/atom.xml
    ```
2. **Microformats / endpoint:** run the deployed homepage + a post through
   <https://indiewebify.me> — it should find the `h-card`, `h-entry`, and the webmention endpoint.
3. **Webmention receipt:** after Bridgy Fed is connected, reply to a post from a fediverse
   account; confirm it appears on your webmention.io dashboard.
4. **Render:** run the refresh job manually (Actions → "Refresh webmentions" → Run workflow);
   it commits the cache and triggers a deploy. The reply then shows under the post.
5. **Giscus:** open a published post, confirm the widget mounts, post a test comment, and
   toggle dark mode to confirm the iframe re-themes.
6. **Drafts:** open a draft URL in `npm run dev` — there must be **no** Responses section.

## Files involved

| Path                                            | Role                                                           |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `src/data/comments-config.ts`                   | Giscus IDs, webmention domain, bridged handles (**edit this**) |
| `src/data/webmentions.json`                     | Committed cache the build reads (seed = empty)                 |
| `src/utils/webmentions.ts`                      | Reads + filters cached mentions per post URL                   |
| `src/utils/sanitize-webmention.ts`              | Locks down untrusted reply HTML                                |
| `src/components/blog/Responses.astro`           | The unified "Responses" section                                |
| `src/components/blog/Webmentions.astro`         | Fediverse/Bluesky replies + facepile                           |
| `src/components/blog/Giscus.astro`              | GitHub Discussions widget + theme sync                         |
| `src/pages/rss.xml.ts`, `src/pages/atom.xml.ts` | Feeds (federation discovery)                                   |
| `.github/scripts/update-webmentions.mjs`        | Zero-dep incremental cache updater                             |
| `.github/workflows/webmentions.yaml`            | Scheduled sparse-checkout refresh job                          |

## Per-post opt-out

Set `comments: false` in a post's frontmatter to hide the Responses section for that post.
Drafts never show responses.

## Privacy note

Reply author avatars are hot-linked from webmention.io's image host, so a reader's browser
makes one request there when viewing comments. To eliminate that, download avatars at build
time and serve them locally — a reasonable future enhancement.
