import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { priceRecords } from "@/db/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const id = parseInt(jobId, 10);

  if (isNaN(id)) {
    return Response.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const conditions = [eq(priceRecords.jobId, id)];
  if (from) conditions.push(gte(priceRecords.scrapedAt, new Date(from)));
  if (to) conditions.push(lte(priceRecords.scrapedAt, new Date(to)));

  const prices = await db
    .select()
    .from(priceRecords)
    .where(and(...conditions))
    .orderBy(desc(priceRecords.scrapedAt))
    .limit(limit);

  return Response.json({ prices });
}
