import Anthropic from "@anthropic-ai/sdk";
import { ExtractionResultSchema, type ExtractedPrice } from "../types";

const client = new Anthropic();

const EXTRACTION_TOOL: Anthropic.Messages.Tool = {
  name: "submit_listings",
  description:
    "Submit the extracted ticket listings from the page. Call this with all the ticket listings you found.",
  input_schema: {
    type: "object" as const,
    properties: {
      listings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            price: {
              type: "number",
              description: "Ticket price in dollars (no currency symbol)",
            },
            section: {
              type: ["string", "null"],
              description: "Section/area name",
            },
            row: {
              type: ["string", "null"],
              description: "Row identifier",
            },
            seat: {
              type: ["string", "null"],
              description: "Seat number(s)",
            },
            quantity: {
              type: "integer",
              description: "Number of tickets available (default 1)",
              minimum: 1,
            },
            listingType: {
              type: ["string", "null"],
              description:
                'Ticket type e.g. "Standard", "VIP", "Parking"',
            },
          },
          required: ["price"],
        },
      },
    },
    required: ["listings"],
  },
};

const SYSTEM_PROMPT = `You are a data extraction assistant. Given a Markdown representation of a ticket marketplace page (e.g., StubHub), extract all available ticket listings.

For each listing, extract:
- price: the ticket price in dollars (number, no currency symbol)
- section: the section/area name (string or null)
- row: the row identifier (string or null)
- seat: the seat number(s) (string or null)
- quantity: number of tickets available (integer, default 1)
- listingType: the ticket type e.g. "Standard", "VIP", "Parking" (string or null)

Use the submit_listings tool to return the results. If no listings are found, call it with an empty array.`;

export async function extractPrices(
  markdown: string
): Promise<ExtractedPrice[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "submit_listings" },
    messages: [
      {
        role: "user",
        content: `Extract ticket listings from this page:\n\n${markdown}`,
      },
    ],
  });

  const toolBlock = message.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_listings"
  );

  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("LLM did not return tool use response");
  }

  const result = ExtractionResultSchema.parse(toolBlock.input);
  return result.listings;
}
