import { z } from "zod/v4";

// Shared constants
export const FREQUENCY_OPTIONS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily", value: "0 9 * * *" },
] as const;

export const ALERT_TYPES = [
  {
    value: "cheapest_below" as const,
    label: "Cheapest ticket below price",
    unit: "$",
  },
  {
    value: "cheapest_above" as const,
    label: "Cheapest ticket above price",
    unit: "$",
  },
  {
    value: "avg_deviation" as const,
    label: "Average deviates from 30-day trend",
    unit: "%",
  },
];

const validCronValues = FREQUENCY_OPTIONS.map((o) => o.value) as unknown as [
  string,
  ...string[],
];

// Job validation schemas
export const createJobSchema = z.object({
  url: z
    .url()
    .refine(
      (u) => {
        try {
          const parsed = new URL(u);
          return parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Only HTTPS URLs are allowed" }
    ),
  eventName: z.string().optional(),
  cronExpression: z.enum(validCronValues).default("0 */6 * * *"),
});

export const updateJobSchema = createJobSchema.extend({
  status: z.enum(["active", "paused"]),
});

// Alert validation schemas
export const createAlertSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  type: z.enum(["cheapest_above", "cheapest_below", "avg_deviation"]),
  threshold: z.coerce.number().positive(),
  email: z.email(),
});

export const updateAlertSchema = z.object({
  type: z.enum(["cheapest_above", "cheapest_below", "avg_deviation"]),
  threshold: z.coerce.number().positive(),
  email: z.email(),
  active: z
    .string()
    .transform((v) => v === "true"),
});
