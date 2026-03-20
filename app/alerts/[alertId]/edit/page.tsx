import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { alertRules } from "@/db/schema";
import { updateAlert, deleteAlert } from "@/app/_actions/alert-actions";

const ALERT_TYPES = [
  {
    value: "cheapest_below",
    label: "Cheapest ticket below price",
  },
  {
    value: "cheapest_above",
    label: "Cheapest ticket above price",
  },
  {
    value: "avg_deviation",
    label: "Average deviates from 30-day trend",
  },
];

export default async function EditAlertPage({
  params,
}: {
  params: Promise<{ alertId: string }>;
}) {
  const { alertId } = await params;
  const id = parseInt(alertId, 10);

  const alert = await db.query.alertRules.findFirst({
    where: eq(alertRules.id, id),
  });

  if (!alert) notFound();

  const updateAction = updateAlert.bind(null, id);
  const deleteAction = deleteAlert.bind(null, id);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Edit Alert</h1>

      <form action={updateAction} className="space-y-4">
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium">
            Alert Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={alert.type}
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
            defaultValue={alert.threshold}
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
            defaultValue={alert.email}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label htmlFor="active" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="active"
            name="active"
            defaultValue={alert.active ? "true" : "false"}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="true">Active</option>
            <option value="false">Paused</option>
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
          Delete Alert
        </button>
      </form>
    </div>
  );
}
