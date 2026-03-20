"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { alertRules } from "@/db/schema";
import { createAlertSchema, updateAlertSchema } from "@/lib/validation";

export async function createAlert(formData: FormData) {
  const parsed = createAlertSchema.parse({
    jobId: formData.get("jobId"),
    type: formData.get("type"),
    threshold: formData.get("threshold"),
    email: formData.get("email"),
  });

  await db.insert(alertRules).values(parsed);

  revalidatePath("/alerts");
  redirect("/alerts");
}

export async function updateAlert(alertId: number, formData: FormData) {
  const parsed = updateAlertSchema.parse({
    type: formData.get("type"),
    threshold: formData.get("threshold"),
    email: formData.get("email"),
    active: formData.get("active"),
  });

  await db
    .update(alertRules)
    .set(parsed)
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
