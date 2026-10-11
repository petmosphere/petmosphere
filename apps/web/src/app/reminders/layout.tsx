export default function RemindersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // No background here: the page's own <main> paints its color, and an
    // opaque wrapper would hide the md+ backdrop gradient from globals.css.
    <div className="relative isolate min-h-dvh">{children}</div>
  );
}
