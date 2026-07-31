import type { MetadataRoute } from "next";

/**
 * Defines a robots policy that disallows all user agents from accessing the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
