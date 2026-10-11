import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";

import type { Size } from "../schemas/taxonomy.schema";
import { useTaxonomySearch } from "../use-taxonomy-search";
import { slugColumn, sortOrderColumn, usageColumn } from "./columns";
import { RowActions } from "./row-actions";
import { SizeDialog } from "./size-dialog";
import { TaxonomyEmpty } from "./taxonomy-empty";

const COLUMNS: ColumnDef<Size>[] = [
  {
    accessorKey: "name",
    header: "Size",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  slugColumn<Size>(),
  sortOrderColumn<Size>(),
  usageColumn<Size, "variant_count">("variant_count", "Variants"),
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <RowActions
          kind="sizes"
          id={row.original.id}
          name={row.original.name}
          inUseMessage={`In use by ${row.original.variant_count} variants. Change their size first.`}
          editDialog={(state) => <SizeDialog size={row.original} {...state} />}
        />
      </div>
    ),
  },
];

export function SizesTable({ query }: { query: string | undefined }) {
  const sizes = useTaxonomySearch("sizes", query);
  return (
    <DataTable
      columns={COLUMNS}
      data={sizes}
      empty={<TaxonomyEmpty noun="sizes" query={query} />}
    />
  );
}
