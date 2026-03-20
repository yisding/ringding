import type { BrowserResult, ScraperBackend } from "../types";

function getBackend(): ScraperBackend {
  const env = process.env.SCRAPER_BACKEND || "playwright";
  if (!["playwright", "camoufox", "hero", "byparr"].includes(env)) {
    throw new Error(`Unknown SCRAPER_BACKEND: ${env}`);
  }
  return env as ScraperBackend;
}

async function fetchWithPlaywright(url: string): Promise<BrowserResult> {
  // playwright-extra with stealth plugin + rebrowser-playwright patches
  const { chromium } = await import("playwright-extra");
  const StealthPlugin = (await import("puppeteer-extra-plugin-stealth"))
    .default;
  chromium.use(StealthPlugin());

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    // Give extra time for dynamic content
    await page.waitForTimeout(3000);
    const html = await page.content();
    return { html };
  } finally {
    await browser.close();
  }
}

async function fetchWithCamoufox(url: string): Promise<BrowserResult> {
  const { Camoufox } = await import("camoufox-js");
  const browser = await Camoufox({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    return { html };
  } finally {
    await browser.close();
  }
}

async function fetchWithHero(url: string): Promise<BrowserResult> {
  const Hero = (await import("@ulixee/hero-playground")).default;
  const hero = new Hero();
  try {
    await hero.goto(url);
    await hero.waitForPaintingStable();
    const html = await hero.document.documentElement.outerHTML;
    return { html };
  } finally {
    await hero.close();
  }
}

async function fetchWithByparr(url: string): Promise<BrowserResult> {
  const byparrUrl =
    process.env.BYPARR_URL || "http://localhost:8191/v1";

  const response = await fetch(byparrUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cmd: "request.get",
      url,
      maxTimeout: 60_000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Byparr request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    solution: { response: string };
  };
  return { html: data.solution.response };
}

export async function fetchPage(url: string): Promise<BrowserResult> {
  const backend = getBackend();

  switch (backend) {
    case "playwright":
      return fetchWithPlaywright(url);
    case "camoufox":
      return fetchWithCamoufox(url);
    case "hero":
      return fetchWithHero(url);
    case "byparr":
      return fetchWithByparr(url);
  }
}
