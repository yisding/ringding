import cron, { type ScheduledTask } from "node-cron";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scrapeJobs } from "@/db/schema";
import { runScrape } from "../scraper/pipeline";

const tasks = new Map<number, ScheduledTask>();

export async function initScheduler(): Promise<void> {
  const activeJobs = await db.query.scrapeJobs.findMany({
    where: eq(scrapeJobs.status, "active"),
  });

  for (const job of activeJobs) {
    scheduleJob(job.id, job.cronExpression);
  }

  console.log(`[scheduler] Initialized ${activeJobs.length} cron jobs`);
}

export function scheduleJob(jobId: number, cronExpression: string): void {
  // Stop existing task if any
  unscheduleJob(jobId);

  if (!cron.validate(cronExpression)) {
    console.error(
      `[scheduler] Invalid cron expression for job ${jobId}: ${cronExpression}`
    );
    return;
  }

  const task = cron.schedule(cronExpression, async () => {
    console.log(`[scheduler] Running scrape for job ${jobId}`);
    const result = await runScrape(jobId);
    if (!result.success) {
      console.error(`[scheduler] Scrape failed for job ${jobId}:`, result.error);
    } else {
      console.log(
        `[scheduler] Scrape completed for job ${jobId}: ${result.priceCount} prices`
      );
    }
  });

  tasks.set(jobId, task);
}

export function unscheduleJob(jobId: number): void {
  const existing = tasks.get(jobId);
  if (existing) {
    existing.stop();
    tasks.delete(jobId);
  }
}

export function updateSchedule(jobId: number, cronExpression: string): void {
  scheduleJob(jobId, cronExpression);
}
