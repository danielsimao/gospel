import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPreferredLocale } from "@/lib/i18n";

export default async function RootPage() {
  const headerList = await headers();
  const locale = getPreferredLocale(headerList.get("accept-language"));
  redirect(`/${locale}`);
}
