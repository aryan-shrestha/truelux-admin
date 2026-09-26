import "server-only";

import { env } from "@/lib/env";

// The API's local file storage answers with a site-relative `/media/…` path, while
// Cloudinary answers with an absolute URL; an absolute URL passes through unchanged.
export function mediaUrl(url: string): string {
  return new URL(url, env.apiBaseUrl).href;
}
