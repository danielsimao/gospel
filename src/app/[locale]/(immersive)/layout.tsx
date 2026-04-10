import { notFound } from "next/navigation";
import { StickyDeathCounter } from "@/components/shared/sticky-death-counter";
import { isValidLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export default async function ImmersiveLayout({ params, children }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const allMessages = await import(`@/messages/${locale}.json`);
  const data = allMessages.default;

  return (
    <>
      <StickyDeathCounter
        label={data.eternity?.counter?.label ?? ""}
        liveBadge={data.eternity?.counter?.liveBadge ?? ""}
      />
      {children}
    </>
  );
}
