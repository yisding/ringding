import { runScrape } from "@/lib/scraper/pipeline";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const id = parseInt(jobId, 10);

  if (isNaN(id)) {
    return Response.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const result = await runScrape(id);

  if (!result.success) {
    return Response.json(result, { status: 500 });
  }

  return Response.json(result);
}
