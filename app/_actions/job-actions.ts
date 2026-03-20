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
import { createJobSchema, updateJobSchema } from "@/lib/validation";

export async function createJob(formData: FormData) {
  const parsed = createJobSchema.parse({
    url: formData.get("url"),
    eventName: formData.get("eventName") || undefined,
    cronExpression: formData.get("cronExpression"),
  });

  const [job] = await db
    .insert(scrapeJobs)
    .values({
      url: parsed.url,
      eventName: parsed.eventName ?? null,
      cronExpression: parsed.cronExpression,
    })
    .returning();

  scheduleJob(job.id, job.cronExpression);
  revalidatePath("/");
  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function updateJob(jobId: number, formData: FormData) {
  const parsed = updateJobSchema.parse({
    url: formData.get("url"),
    eventName: formData.get("eventName") || undefined,
    cronExpression: formData.get("cronExpression"),
    status: formData.get("status"),
  });

  await db
    .update(scrapeJobs)
    .set({
      url: parsed.url,
      eventName: parsed.eventName ?? null,
      cronExpression: parsed.cronExpression,
      status: parsed.status,
      updatedAt: new Date(),
    })
    .where(eq(scrapeJobs.id, jobId));

  if (parsed.status === "active") {
    updateSchedule(jobId, parsed.cronExpression);
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

export async function triggerScrapeAction(jobId: number) {
  await runScrape(jobId);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
}
