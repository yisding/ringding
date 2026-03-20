import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { scrapeJobs, priceRecords } from "@/db/schema";
import { triggerScrapeAction } from "@/app/_actions/job-actions";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const id = parseInt(jobId, 10);

  const job = await db.query.scrapeJobs.findFirst({
    where: eq(scrapeJobs.id, id),
  });

  if (!job) notFound();

  // Get recent prices grouped by scrape time
  const recentPrices = await db
    .select()
    .from(priceRecords)
    .where(eq(priceRecords.jobId, id))
    .orderBy(desc(priceRecords.scrapedAt))
    .limit(200);

  // Compute stats
  const cheapestEver = recentPrices.length
    ? Math.min(...recentPrices.map((p) => p.price))
    : null;

  const latestTimestamp = recentPrices[0]?.scrapedAt;
  const latestBatch = recentPrices.filter(
    (p) => p.scrapedAt?.getTime() === latestTimestamp?.getTime()
  );
  const currentCheapest = latestBatch.length
    ? Math.min(...latestBatch.map((p) => p.price))
    : null;
  const currentAvg = latestBatch.length
    ? latestBatch.reduce((s, p) => s + p.price, 0) / latestBatch.length
    : null;

  const scrapeAction = triggerScrapeAction.bind(null, id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {job.eventName || "Untitled Job"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 break-all">{job.url}</p>
        </div>
        <div className="flex gap-2">
          <form action={scrapeAction}>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Scrape Now
            </button>
          </form>
          <Link
            href={`/jobs/${id}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Edit
          </Link>
          <Link
            href={`/alerts/new?jobId=${id}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Add Alert
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Status" value={job.status} />
        <StatCard
          label="Cheapest Ever"
          value={cheapestEver != null ? `$${cheapestEver.toFixed(2)}` : "-"}
        />
        <StatCard
          label="Current Cheapest"
          value={
            currentCheapest != null ? `$${currentCheapest.toFixed(2)}` : "-"
          }
        />
        <StatCard
          label="Current Avg"
          value={currentAvg != null ? `$${currentAvg.toFixed(2)}` : "-"}
        />
      </div>

      {/* Job info */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Schedule</dt>
            <dd className="font-mono">{job.cronExpression}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Last Scraped</dt>
            <dd>
              {job.lastScrapedAt ? job.lastScrapedAt.toLocaleString() : "Never"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd>{job.createdAt.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Latest Listings</dt>
            <dd>{latestBatch.length}</dd>
          </div>
        </dl>
      </div>

      {/* Price table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="font-semibold">Recent Prices</h2>
        </div>
        {recentPrices.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            No price data yet. Click &quot;Scrape Now&quot; to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium">Section</th>
                  <th className="px-4 py-2 font-medium">Row</th>
                  <th className="px-4 py-2 font-medium">Qty</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Scraped</th>
                </tr>
              </thead>
              <tbody>
                {recentPrices.map((price) => (
                  <tr
                    key={price.id}
                    className="border-b border-gray-100 dark:border-gray-800/50"
                  >
                    <td className="px-4 py-2 font-medium">
                      ${price.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">{price.section || "-"}</td>
                    <td className="px-4 py-2">{price.row || "-"}</td>
                    <td className="px-4 py-2">{price.quantity}</td>
                    <td className="px-4 py-2">{price.listingType || "-"}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {price.scrapedAt?.toLocaleString()}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
