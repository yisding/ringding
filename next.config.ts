import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "playwright-extra",
    "rebrowser-playwright",
    "camoufox-js",
    "@ulixee/hero-playground",
    "node-cron",
    "turndown",
  ],
};

export default nextConfig;
