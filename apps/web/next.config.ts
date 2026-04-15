import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@character-factory/core", "@character-factory/db"]
};

export default nextConfig;

