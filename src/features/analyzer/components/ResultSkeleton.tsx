export function ResultSkeleton() {
  return (
    <section className="rounded-2xl border border-line bg-elev p-6">
      <div className="flex gap-5">
        <div className="h-[101px] w-[180px] shrink-0 animate-pulse rounded-xl bg-inputbg" />
        <div className="flex flex-1 flex-col gap-3 py-1">
          <div className="h-4 w-3/4 animate-pulse rounded bg-inputbg" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-inputbg" />
          <div className="mt-auto h-3 w-1/2 animate-pulse rounded bg-inputbg" />
        </div>
      </div>
    </section>
  );
}
