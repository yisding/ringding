import { db } from "@/db";
import { createAlert } from "@/app/_actions/alert-actions";
import { ALERT_TYPES } from "@/lib/validation";

export default async function NewAlertPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  const jobs = await db.query.scrapeJobs.findMany();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">New Alert Rule</h1>

      <form action={createAlert} className="space-y-4">
        <div>
          <label htmlFor="jobId" className="mb-1 block text-sm font-medium">
            Job
          </label>
          <select
            id="jobId"
            name="jobId"
            required
            defaultValue={jobId || ""}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="" disabled>
              Select a job...
            </option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.eventName || job.url}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium">
            Alert Type
          </label>
          <select
            id="type"
            name="type"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            {ALERT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="threshold"
            className="mb-1 block text-sm font-medium"
          >
            Threshold
          </label>
          <input
            type="number"
            id="threshold"
            name="threshold"
            required
            step="0.01"
            min="0"
            placeholder="e.g., 100.00 or 10 for 10%"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Alert
        </button>
      </form>
    </div>
  );
}
