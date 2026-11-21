import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // The Cloudflare build installs the lockfile before running OpenNext.
  buildCommand: "node node_modules/next/dist/bin/next build",
};
