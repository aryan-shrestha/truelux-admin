import type { NextConfig } from "next";

import "./lib/env";

const nextConfig: NextConfig = {
  experimental: {
    // One product image or brand logo per action; the API caps images at 5 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
