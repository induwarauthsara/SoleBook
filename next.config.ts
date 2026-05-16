import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js doesn't accidentally
  // pick up an unrelated lockfile from a parent directory.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
