# Search Engine Indexing

The application ships with a default that **blocks all search-engine
crawling** via a Next.js static [`robots.ts`](../app/robots.ts).

## Rationale

An SSO application exposes auth flows, identity management pages, and
session-protected dashboards — none of which belong in search results.
Allowing search engines to index these routes would:

- Waste crawl budget on pages with no SEO value.
- Expose application structure (paths, query parameters) in search
  snippets — an information-disclosure concern.
- Serve stale or misleading auth-page metadata in search results.

## Implementation

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
```

Next.js serves this file automatically at `/robots.txt`. No build-time
variables, route handlers, or proxy configuration is required.

The file follows the [Next.js robots file
convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots).

## Making the Landing Page Indexable

If you deploy this application as a public product and want the
marketing landing page at `/` to appear in search results, change the
`disallow` rule:

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/auth/", "/dashboard/", "/api/"],
    },
  };
}
```

This allows crawling of the root page while keeping auth flows,
dashboards, and API handlers out of search results.

For more granular control — allowing specific crawlers, setting crawl
delays, or adding a sitemap reference — see the
[Next.js `robots.ts` API](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots).
