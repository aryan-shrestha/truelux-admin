import { Skeleton } from "@/components/ui/skeleton";

const KPI_COUNT = 4;
const ROW_COUNT = 6;

export function PageSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        Loading
      </span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: KPI_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-10" />
        ))}
      </div>
    </div>
  );
}
