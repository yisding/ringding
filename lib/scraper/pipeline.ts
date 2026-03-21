import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scrapeJobs, priceRecords } from "@/db/schema";
import { fetchPage } from "./browser";
import { htmlToMarkdown } from "./markdown";
import { extractPrices } from "./extractor";
import { checkAlerts } from "../alerts/checker";
import type { ScrapeResult } from "../types";

export async function runScrape(jobId: number): Promise<ScrapeResult> {
  try {
    // 1. Get the job
    const job = await db.query.scrapeJobs.findFirst({
      where: eq(scrapeJobs.id, jobId),
    });

    if (!job) {
      return { success: false, jobId, priceCount: 0, error: "Job not found" };
    }

    if (job.status === "paused") {
      return { success: false, jobId, priceCount: 0, error: "Job is paused" };
    }

    // 2. Fetch the page
    const { html } = await fetchPage(job.url);

    // 3. Convert to markdown
    const markdown = htmlToMarkdown(html);

    // 4. Extract prices via LLM
    const prices = await extractPrices(markdown);

    // 5. Save to database
    const now = new Date();

    if (prices.length > 0) {
      await db.insert(priceRecords).values(
        prices.map((p) => ({
          jobId,
          price: p.price,
          section: p.section ?? null,
          row: p.row ?? null,
          seat: p.seat ?? null,
          quantity: p.quantity ?? 1,
          listingType: p.listingType ?? null,
          scrapedAt: now,
        }))
      );
    }

    // 6. Update job timestamp and clear any previous error
    await db
      .update(scrapeJobs)
      .set({ lastScrapedAt: now, updatedAt: now, status: "active", lastError: null })
      .where(eq(scrapeJobs.id, jobId));

    // 7. Check alert conditions
    await checkAlerts(jobId, prices);

    return { success: true, jobId, priceCount: prices.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[pipeline] Job ${jobId} failed:`, message);

    // Mark job as error and persist the error message
    try {
      await db
        .update(scrapeJobs)
        .set({ status: "error", lastError: message, updatedAt: new Date() })
        .where(eq(scrapeJobs.id, jobId));
    } catch (dbError) {
      console.error("[pipeline] Failed to update job status:", dbError);
    }

    return { success: false, jobId, priceCount: 0, error: message };
  }
}
