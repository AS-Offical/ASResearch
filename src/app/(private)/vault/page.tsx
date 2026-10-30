import { getTranslations } from "next-intl/server";
import { getPrivateLocale } from "@/lib/private/server";
import { VaultForm } from "./VaultForm";

export default async function VaultPage() {
  const t = await getTranslations({ locale: await getPrivateLocale(), namespace: "Private" });
  return (
    <section className="container container--reading">
      <p className="pixel pixel--s muted">{t("kicker")}</p>
      <h1 className="pixel pixel--m">{t("vaultTitle")}</h1>
      <p>{t("vaultLead")}</p>
      <VaultForm />
    </section>
  );
}
