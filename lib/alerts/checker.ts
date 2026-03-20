import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { alertRules, alertHistory, priceRecords } from "@/db/schema";
import { sendAlertEmail } from "./emailer";
import type { ExtractedPrice } from "../types";

export async function checkAlerts(
  jobId: number,
  currentPrices: ExtractedPrice[]
): Promise<void> {
  if (currentPrices.length === 0) return;

  const rules = await db.query.alertRules.findMany({
    where: and(eq(alertRules.jobId, jobId), eq(alertRules.active, true)),
  });

  if (rules.length === 0) return;

  const cheapest = Math.min(...currentPrices.map((p) => p.price));
  const avg =
    currentPrices.reduce((sum, p) => sum + p.price, 0) / currentPrices.length;

  for (const rule of rules) {
    let triggered = false;
    let message = "";
    let trailingAvg: number | undefined;

    switch (rule.type) {
      case "cheapest_above":
        if (cheapest > rule.threshold) {
          triggered = true;
          message = `Cheapest ticket ($${cheapest.toFixed(2)}) is above your threshold of $${rule.threshold.toFixed(2)}`;
        }
        break;

      case "cheapest_below":
        if (cheapest < rule.threshold) {
          triggered = true;
          message = `Cheapest ticket ($${cheapest.toFixed(2)}) is below your threshold of $${rule.threshold.toFixed(2)}`;
        }
        break;

      case "avg_deviation": {
        const thirtyDaysAgo = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        );

        const result = await db
          .select({ avg: sql<number>`avg(price)` })
          .from(priceRecords)
          .where(
            and(
              eq(priceRecords.jobId, jobId),
              gte(priceRecords.scrapedAt, thirtyDaysAgo)
            )
          );

        trailingAvg = result[0]?.avg;
        if (trailingAvg == null) break;

        const deviationPct =
          Math.abs((avg - trailingAvg) / trailingAvg) * 100;

        if (deviationPct > rule.threshold) {
          triggered = true;
          const direction = avg > trailingAvg ? "higher" : "lower";
          message = `Average price ($${avg.toFixed(2)}) is ${deviationPct.toFixed(1)}% ${direction} than the 30-day average ($${trailingAvg.toFixed(2)})`;
        }
        break;
      }
    }

    if (triggered) {
      await db.insert(alertHistory).values({
        alertId: rule.id,
        message,
        cheapestPrice: cheapest,
        avgPrice: avg,
        trailingAvg: trailingAvg ?? null,
      });

      await sendAlertEmail(rule.email, message, jobId);
    }
  }
}
