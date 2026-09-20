import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ["react-hot-toast"],
  webpack: (config) => {
    try {
      const swcHelpersPath = path.dirname(require.resolve("@swc/helpers/package.json"));
      config.resolve.alias = {
        ...config.resolve.alias,
        "@swc/helpers": swcHelpersPath,
        "@swc/helpers/_/_tagged_template_literal": path.join(swcHelpersPath, "cjs", "_tagged_template_literal.cjs"),
      };
    } catch {
      // fallback
    }
    return config;
  },
};

export default nextConfig;
