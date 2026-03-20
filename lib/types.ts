import { z } from "zod/v4";

// Browser result
export interface BrowserResult {
  html: string;
}

// Extracted price record from LLM
export const PriceRecordSchema = z.object({
  price: z.number(),
  section: z.string().nullable().optional(),
  row: z.string().nullable().optional(),
  seat: z.string().nullable().optional(),
  quantity: z.number().int().positive().optional().default(1),
  listingType: z.string().nullable().optional(),
});

export type ExtractedPrice = z.infer<typeof PriceRecordSchema>;

export const ExtractionResultSchema = z.object({
  listings: z.array(PriceRecordSchema),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// Scraper backend types
export type ScraperBackend = "playwright" | "camoufox" | "hero" | "byparr";

// Scrape pipeline result
export interface ScrapeResult {
  success: boolean;
  jobId: number;
  priceCount: number;
  error?: string;
}

// Alert types
export type AlertType = "cheapest_above" | "cheapest_below" | "avg_deviation";
