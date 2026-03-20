import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { alertRules, scrapeJobs } from "@/db/schema";
import { toggleAlert } from "@/app/_actions/alert-actions";

export default async function AlertsPage() {
  const rules = await db
    .select({
      rule: alertRules,
      jobName: scrapeJobs.eventName,
      jobUrl: scrapeJobs.url,
    })
    .from(alertRules)
    .leftJoin(scrapeJobs, eq(alertRules.jobId, scrapeJobs.id))
    .orderBy(desc(alertRules.createdAt));

  const history = await db.query.alertHistory.findMany({
    orderBy: (h, { desc }) => [desc(h.triggeredAt)],
    limit: 50,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <Link
          href="/alerts/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Alert
        </Link>
      </div>

      {/* Alert rules */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="font-semibold">Alert Rules</h2>
        </div>
        {rules.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            No alert rules yet.{" "}
            <Link href="/alerts/new" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {rules.map(({ rule, jobName, jobUrl }) => {
              const toggleAction = async () => {
                "use server";
                await toggleAlert(rule.id, !rule.active);
              };

              return (
                <div
                  key={rule.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {rule.type.replace("_", " ")} — $
                      {rule.threshold.toFixed(2)}
                      {rule.type === "avg_deviation" ? "%" : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      Job: {jobName || jobUrl || `#${rule.jobId}`} | Email:{" "}
                      {rule.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={toggleAction}>
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          rule.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                        }`}
                      >
                        {rule.active ? "Active" : "Paused"}
                      </button>
                    </form>
                    <Link
                      href={`/alerts/${rule.id}/edit`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert history */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="font-semibold">Recent Alert History</h2>
        </div>
        {history.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No alerts triggered yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {history.map((h) => (
              <div key={h.id} className="px-4 py-3">
                <p className="text-sm">{h.message}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {h.triggeredAt.toLocaleString()}
                  {h.cheapestPrice != null &&
                    ` | Cheapest: $${h.cheapestPrice.toFixed(2)}`}
                  {h.avgPrice != null &&
                    ` | Avg: $${h.avgPrice.toFixed(2)}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
