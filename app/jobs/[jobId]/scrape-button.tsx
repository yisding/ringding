"use client";

import { useState, useTransition } from "react";
import { triggerScrapeAction } from "@/app/_actions/job-actions";

export function ScrapeButton({ jobId }: { jobId: number }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleScrape() {
    startTransition(async () => {
      const result = await triggerScrapeAction(jobId);
      if (!result.success) {
        setError(result.error ?? "Unknown error");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleScrape}
        disabled={isPending}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "Scraping..." : "Scrape Now"}
      </button>

      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-xl dark:border-red-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Scrape Failed
            </h3>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-4 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}
