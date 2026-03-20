"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { scrapeJobs } from "@/db/schema";
import {
  scheduleJob,
  unscheduleJob,
  updateSchedule,
} from "@/lib/scheduler/cron-manager";
import { runScrape } from "@/lib/scraper/pipeline";

export async function createJob(formData: FormData) {
  const url = formData.get("url") as string;
  const eventName = (formData.get("eventName") as string) || null;
  const cronExpression =
    (formData.get("cronExpression") as string) || "0 */6 * * *";

  if (!url) {
    throw new Error("URL is required");
  }

  const [job] = await db
    .insert(scrapeJobs)
    .values({ url, eventName, cronExpression })
    .returning();

  scheduleJob(job.id, job.cronExpression);
  revalidatePath("/");
  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function updateJob(jobId: number, formData: FormData) {
  const url = formData.get("url") as string;
  const eventName = (formData.get("eventName") as string) || null;
  const cronExpression =
    (formData.get("cronExpression") as string) || "0 */6 * * *";
  const status = (formData.get("status") as string) || "active";

  await db
    .update(scrapeJobs)
    .set({
      url,
      eventName,
      cronExpression,
      status: status as "active" | "paused" | "error",
      updatedAt: new Date(),
    })
    .where(eq(scrapeJobs.id, jobId));

  if (status === "active") {
    updateSchedule(jobId, cronExpression);
  } else {
    unscheduleJob(jobId);
  }

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function deleteJob(jobId: number) {
  unscheduleJob(jobId);
  await db.delete(scrapeJobs).where(eq(scrapeJobs.id, jobId));
  revalidatePath("/");
  revalidatePath("/jobs");
  redirect("/jobs");
}

export async function triggerScrape(jobId: number) {
  const result = await runScrape(jobId);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
  return result;
}

export async function triggerScrapeAction(jobId: number) {
  await runScrape(jobId);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
}
