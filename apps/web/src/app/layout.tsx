import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Petmosphere",
    template: "%s | Petmosphere",
  },
  description: "Your pet's health, organised.",
  applicationName: "Petmosphere",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [
      {
        sizes: "180x180",
        type: "image/png",
        url: "/icons/apple-touch-icon.png",
      },
    ],
    icon: [
      {
        sizes: "192x192",
        type: "image/png",
        url: "/icons/icon-192.png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ED802A",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={manrope.className} lang="en-AU">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
