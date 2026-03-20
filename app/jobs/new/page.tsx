import { createJob } from "@/app/_actions/job-actions";
import { FREQUENCY_OPTIONS } from "@/lib/validation";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">New Scrape Job</h1>

      <form action={createJob} className="space-y-4">
        <div>
          <label
            htmlFor="url"
            className="mb-1 block text-sm font-medium"
          >
            URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            required
            placeholder="https://www.stubhub.com/..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label
            htmlFor="eventName"
            className="mb-1 block text-sm font-medium"
          >
            Event Name (optional)
          </label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            placeholder="e.g., Taylor Swift - Eras Tour NYC"
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
            defaultValue="0 */6 * * *"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Job
        </button>
      </form>
    </div>
  );
}
