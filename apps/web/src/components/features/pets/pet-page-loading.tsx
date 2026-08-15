export function PetPageLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading your pets"
      className="mx-auto min-h-dvh w-full max-w-md animate-pulse bg-[#fdf8f2] px-6 py-8 motion-reduce:animate-none"
    >
      <div className="h-6 w-32 rounded-full bg-[#ead9c7]" />
      <div className="mx-auto mt-28 size-32 rounded-full bg-[#fff0e1]" />
      <div className="mx-auto mt-8 h-7 w-40 rounded-full bg-[#ead9c7]" />
      <div className="mx-auto mt-4 h-5 w-64 rounded-full bg-[#f0e6d8]" />
    </main>
  );
}
