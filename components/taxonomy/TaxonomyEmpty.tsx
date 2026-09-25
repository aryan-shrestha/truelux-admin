import { SearchXIcon } from "lucide-react";

import { TableEmpty } from "@/components/data-table/TableEmpty";

export function TaxonomyEmpty({ noun, query }: { noun: string; query: string }) {
  return (
    <TableEmpty
      icon={SearchXIcon}
      title={query ? `No ${noun} match “${query}”` : `No ${noun} yet`}
      description={query ? "Try a shorter search." : "Create the first one with the button above."}
    />
  );
}
