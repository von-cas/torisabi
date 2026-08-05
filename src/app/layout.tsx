import type { Metadata } from "next";
import { Baloo_2, Geist_Mono, Rubik } from "next/font/google";
import "./globals.css";

/**
 * Baloo 2 shouts, Rubik reads, Geist Mono stamps the product codes.
 * Baloo's plump, rounded caps are the closest type gets to the chunky
 * bubble letters in the Torisabi logo, which is why it carries every heading.
 */
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.torisabi.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Torisabi — your daily crafter in Zamboanga",
    template: "%s | Torisabi",
  },
  description:
    "Small handmade things, made one at a time in Zamboanga. Browse the shelf and order in a few taps on Instagram.",
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Torisabi",
    url: SITE_URL,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${rubik.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
