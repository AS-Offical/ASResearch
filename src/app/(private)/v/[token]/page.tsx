import { PrivateArticle } from "@/components/private/PrivateArticle";
import { Unavailable } from "@/components/private/Unavailable";
import { getPrivateLocale, openByToken } from "@/lib/private/server";

export const dynamic = "force-dynamic";

export default async function SharedResearch({ params }: PageProps<"/v/[token]">) {
  const { token } = await params;
  const locale = await getPrivateLocale();
  const result = await openByToken(token);
  if (result.status === "ok") return <PrivateArticle research={result.research} locale={locale} />;
  return <Unavailable locale={locale} limited={result.status === "limited"} />;
}
