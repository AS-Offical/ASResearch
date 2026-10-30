"use server";

import { redirect } from "next/navigation";
import { hashVaultCode, isPlausibleVaultCode, normalizeVaultCode } from "@/lib/private/crypto";
import { verifyVault } from "@/lib/private/server";

export type VaultState = { error?: "invalid" | "limited" };

export async function submitVault(_prev: VaultState, formData: FormData): Promise<VaultState> {
  const raw = formData.get("code");
  const code = typeof raw === "string" ? normalizeVaultCode(raw.slice(0, 64)) : "";
  const result = await verifyVault((pepper) => hashVaultCode(code, pepper), isPlausibleVaultCode(code));
  if (result.status === "ok") redirect("/vault/read");
  return { error: result.status };
}
