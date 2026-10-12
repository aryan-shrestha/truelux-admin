import { Page } from "@/components/layout/page";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const KPI_COUNT = 4;
const STATUS_COUNT = 5;
const TABLE_ROWS = 5;

function CardHeading({ hasDescription = true }: { hasDescription?: boolean }) {
  return (
    <>
      <CardTitle>
        <Skeleton className="h-5 w-36" />
      </CardTitle>
      {hasDescription && (
        <CardDescription>
          <Skeleton className="h-4 w-56" />
        </CardDescription>
      )}
    </>
  );
}

function TableRows() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-full" />
      {Array.from({ length: TABLE_ROWS }, (_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}

// Built from the same cards and grid as DashboardView and its PageHeader, so the page
// does not shift when the figures arrive.
export function DashboardSkeleton() {
  return (
    <Page isScrollable>
      <div aria-busy="true" className="flex flex-col gap-6">
        <span role="status" className="sr-only">
          Loading the dashboard
        </span>
        <div className="flex items-end justify-between gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="size-9" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: KPI_COUNT }, (_, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardDescription>
                    <Skeleton className="h-4 w-24" />
                  </CardDescription>
                  <CardTitle>
                    <Skeleton className="h-8 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardFooter className="border-t">
                  <Skeleton className="h-4 w-28" />
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardHeading />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardHeading />
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Array.from({ length: STATUS_COUNT }, (_, index) => (
                  <Skeleton key={index} className="h-9 w-28" />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardHeading hasDescription={false} />
                <CardAction>
                  <Skeleton className="h-8 w-24" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <TableRows />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardHeading />
              </CardHeader>
              <CardContent>
                <TableRows />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
