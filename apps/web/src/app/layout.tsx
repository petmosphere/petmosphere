import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Petmosphere",
    template: "%s | Petmosphere",
  },
  description: "Your pet's health, organised.",
  applicationName: "Petmosphere",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#cd9255",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
