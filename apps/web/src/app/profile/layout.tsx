import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No background here: the page's own <main> paints its color, and an opaque
  // wrapper would hide the md+ backdrop gradient from globals.css.
  return <div className="min-h-dvh">{children}</div>;
}
