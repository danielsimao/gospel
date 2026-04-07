import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { NextStepsClient } from "./client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ track?: string }>;
};

export default async function NextStepsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const { track } = await searchParams;
  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;

  return (
    <NextStepsClient
      track={track === "thinking" ? "thinking" : "prayed"}
      nextStepsMessages={data.nextSteps}
      shareMessages={data.share}
      locale={locale as Locale}
    />
  );
}
