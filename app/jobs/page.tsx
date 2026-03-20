import Link from "next/link";
import { db } from "@/db";

export default async function JobsPage() {
  const jobs = await db.query.scrapeJobs.findMany({
    orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scrape Jobs</h1>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500">No scrape jobs yet.</p>
          <Link
            href="/jobs/new"
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            Create your first job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    {job.eventName || "Untitled Job"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 break-all">
                    {job.url}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : job.status === "paused"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {job.cronExpression}
                  </span>
                </div>
              </div>
              {job.lastScrapedAt && (
                <p className="mt-2 text-xs text-gray-400">
                  Last scraped: {job.lastScrapedAt.toLocaleString()}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
