import Link from "next/link";
import { gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { priceRecords, alertHistory } from "@/db/schema";

export default async function DashboardPage() {
  const jobs = await db.query.scrapeJobs.findMany();
  const activeJobs = jobs.filter((j) => j.status === "active");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayScrapes = await db
    .select({ count: sql<number>`count(distinct scraped_at)` })
    .from(priceRecords)
    .where(gte(priceRecords.scrapedAt, todayStart));

  const todayAlerts = await db
    .select({ count: sql<number>`count(*)` })
    .from(alertHistory)
    .where(gte(alertHistory.triggeredAt, todayStart));

  // Get latest prices per job in a single query: fetch the most recent scraped_at per job,
  // then fetch all records at that timestamp.
  const latestTimestamps = await db
    .select({
      jobId: priceRecords.jobId,
      maxScrapedAt: sql<number>`max(scraped_at)`.as("max_scraped_at"),
    })
    .from(priceRecords)
    .groupBy(priceRecords.jobId);

  // Only fetch latest-batch records if there are any jobs with data
  let latestRecords: { jobId: number; price: number }[] = [];
  if (latestTimestamps.length > 0) {
    latestRecords = await db
      .select({
        jobId: priceRecords.jobId,
        price: priceRecords.price,
      })
      .from(priceRecords)
      .where(
        sql`(${priceRecords.jobId}, scraped_at) in (${sql.raw(
          latestTimestamps
            .map((r) => `(${r.jobId}, ${r.maxScrapedAt})`)
            .join(", ")
        )})`
      );
  }

  // Group by job
  const recordsByJob = new Map<
    number,
    { price: number }[]
  >();
  for (const r of latestRecords) {
    const list = recordsByJob.get(r.jobId) ?? [];
    list.push({ price: r.price });
    recordsByJob.set(r.jobId, list);
  }

  const jobsWithPrices = jobs.map((job) => {
    const batch = recordsByJob.get(job.id) ?? [];
    const cheapest = batch.length
      ? Math.min(...batch.map((p) => p.price))
      : null;
    const avg = batch.length
      ? batch.reduce((s, p) => s + p.price, 0) / batch.length
      : null;
    return { ...job, cheapest, avg, listingCount: batch.length };
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Job
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Active Jobs
          </p>
          <p className="text-3xl font-bold">{activeJobs.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Scrapes Today
          </p>
          <p className="text-3xl font-bold">{todayScrapes[0]?.count ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Alerts Today
          </p>
          <p className="text-3xl font-bold">{todayAlerts[0]?.count ?? 0}</p>
        </div>
      </div>

      {/* Jobs table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="font-semibold">Scrape Jobs</h2>
        </div>
        {jobs.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            No jobs yet.{" "}
            <Link href="/jobs/new" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                  <th className="px-4 py-2 font-medium">Event</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Cheapest</th>
                  <th className="px-4 py-2 font-medium">Avg</th>
                  <th className="px-4 py-2 font-medium">Listings</th>
                  <th className="px-4 py-2 font-medium">Last Scraped</th>
                </tr>
              </thead>
              <tbody>
                {jobsWithPrices.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {job.eventName || job.url}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-2">
                      {job.cheapest != null
                        ? `$${job.cheapest.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      {job.avg != null ? `$${job.avg.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-2">{job.listingCount}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {job.lastScrapedAt
                        ? job.lastScrapedAt.toLocaleString()
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    paused:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || ""}`}
    >
      {status}
    </span>
  );
}
