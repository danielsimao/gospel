import "./globals.css";
import type { Metadata } from "next";
import { getMetadataBase } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "Gospel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
