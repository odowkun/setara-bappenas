import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@swc/helpers": path.resolve(__dirname, "node_modules/@swc/helpers"),
      "@swc/helpers/_/_tagged_template_literal": path.resolve(
        __dirname,
        "node_modules/@swc/helpers/cjs/_tagged_template_literal.cjs"
      ),
    };
    return config;
  },
};

export default nextConfig;
