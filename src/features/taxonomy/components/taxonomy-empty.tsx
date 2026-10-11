import { SearchXIcon, ShapesIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export function TaxonomyEmpty({ noun, query }: { noun: string; query: string | undefined }) {
  return query ? (
    <EmptyState
      icon={SearchXIcon}
      title={`No ${noun} match “${query}”`}
      description="Search by name or slug."
    />
  ) : (
    <EmptyState icon={ShapesIcon} title={`No ${noun} yet`} description={`Create the first one.`} />
  );
}
