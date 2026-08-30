import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-[#fdf8f2]">{children}</div>;
}
