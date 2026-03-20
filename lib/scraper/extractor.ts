import Anthropic from "@anthropic-ai/sdk";
import { ExtractionResultSchema, type ExtractedPrice } from "../types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a data extraction assistant. Given a Markdown representation of a ticket marketplace page (e.g., StubHub), extract all available ticket listings.

For each listing, extract:
- price: the ticket price in dollars (number, no currency symbol)
- section: the section/area name (string or null)
- row: the row identifier (string or null)
- seat: the seat number(s) (string or null)
- quantity: number of tickets available (integer, default 1)
- listingType: the ticket type e.g. "Standard", "VIP", "Parking" (string or null)

Return a JSON object with a single key "listings" containing an array of objects.
If no listings are found, return {"listings": []}.
Only return valid JSON, no other text.`;

export async function extractPrices(
  markdown: string
): Promise<ExtractedPrice[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract ticket listings from this page:\n\n${markdown}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse and validate the JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const result = ExtractionResultSchema.parse(parsed);
  return result.listings;
}
