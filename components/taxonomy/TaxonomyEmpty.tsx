import { SearchXIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function TaxonomyEmpty({ noun, query }: { noun: string; query: string }) {
  return (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{query ? `No ${noun} match “${query}”` : `No ${noun} yet`}</EmptyTitle>
        <EmptyDescription>
          {query ? "Try a shorter search." : `Create the first one with the button above.`}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
