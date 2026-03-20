"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { alertRules } from "@/db/schema";
import type { AlertType } from "@/lib/types";

export async function createAlert(formData: FormData) {
  const jobId = parseInt(formData.get("jobId") as string, 10);
  const type = formData.get("type") as AlertType;
  const threshold = parseFloat(formData.get("threshold") as string);
  const email = formData.get("email") as string;

  if (!jobId || !type || isNaN(threshold) || !email) {
    throw new Error("All fields are required");
  }

  await db.insert(alertRules).values({ jobId, type, threshold, email });

  revalidatePath("/alerts");
  redirect("/alerts");
}

export async function updateAlert(alertId: number, formData: FormData) {
  const type = formData.get("type") as AlertType;
  const threshold = parseFloat(formData.get("threshold") as string);
  const email = formData.get("email") as string;
  const active = formData.get("active") === "true";

  await db
    .update(alertRules)
    .set({ type, threshold, email, active })
    .where(eq(alertRules.id, alertId));

  revalidatePath("/alerts");
  redirect("/alerts");
}

export async function deleteAlert(alertId: number) {
  await db.delete(alertRules).where(eq(alertRules.id, alertId));
  revalidatePath("/alerts");
  redirect("/alerts");
}

export async function toggleAlert(alertId: number, active: boolean) {
  await db
    .update(alertRules)
    .set({ active })
    .where(eq(alertRules.id, alertId));
  revalidatePath("/alerts");
}
