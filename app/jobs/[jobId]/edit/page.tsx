import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { scrapeJobs } from "@/db/schema";
import { updateJob, deleteJob } from "@/app/_actions/job-actions";

const FREQUENCY_OPTIONS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily", value: "0 9 * * *" },
];

export default async function EditJobPage({
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

  const updateAction = updateJob.bind(null, id);
  const deleteAction = deleteJob.bind(null, id);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Edit Job</h1>

      <form action={updateAction} className="space-y-4">
        <div>
          <label htmlFor="url" className="mb-1 block text-sm font-medium">
            StubHub URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            required
            defaultValue={job.url}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label
            htmlFor="eventName"
            className="mb-1 block text-sm font-medium"
          >
            Event Name
          </label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            defaultValue={job.eventName || ""}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label
            htmlFor="cronExpression"
            className="mb-1 block text-sm font-medium"
          >
            Scraping Frequency
          </label>
          <select
            id="cronExpression"
            name="cronExpression"
            defaultValue={job.cronExpression}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={job.status}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>

      <form action={deleteAction} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Delete Job
        </button>
      </form>
    </div>
  );
}
