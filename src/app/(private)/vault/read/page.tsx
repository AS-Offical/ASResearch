import { PrivateArticle } from "@/components/private/PrivateArticle";
import { Unavailable } from "@/components/private/Unavailable";
import { getPrivateLocale, openVaultSession } from "@/lib/private/server";

export const dynamic = "force-dynamic";

export default async function VaultRead() {
  const locale = await getPrivateLocale();
  const research = await openVaultSession();
  return research ? <PrivateArticle research={research} locale={locale} /> : <Unavailable locale={locale} />;
}
