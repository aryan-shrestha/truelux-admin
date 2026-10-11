import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";

import type { Shade } from "../schemas/taxonomy.schema";
import { useTaxonomySearch } from "../use-taxonomy-search";
import { slugColumn, sortOrderColumn, usageColumn } from "./columns";
import { RowActions } from "./row-actions";
import { ShadeDialog } from "./shade-dialog";
import { TaxonomyEmpty } from "./taxonomy-empty";

const COLUMNS: ColumnDef<Shade>[] = [
  {
    accessorKey: "name",
    header: "Shade",
    cell: ({ row }) => (
      <span className="flex items-center gap-3">
        <span
          aria-hidden
          className="size-5 rounded-sm border"
          style={{ backgroundColor: row.original.hex_code }}
        />
        <span className="font-medium">{row.original.name}</span>
      </span>
    ),
  },
  {
    accessorKey: "hex_code",
    header: "Hex",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.hex_code}</span>,
  },
  slugColumn<Shade>(),
  sortOrderColumn<Shade>(),
  usageColumn<Shade, "variant_count">("variant_count", "Variants"),
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <RowActions
          kind="shades"
          id={row.original.id}
          name={row.original.name}
          inUseMessage={`In use by ${row.original.variant_count} variants. Change their shade first.`}
          editDialog={(state) => <ShadeDialog shade={row.original} {...state} />}
        />
      </div>
    ),
  },
];

export function ShadesTable({ query }: { query: string | undefined }) {
  const shades = useTaxonomySearch("shades", query);
  return (
    <DataTable
      columns={COLUMNS}
      data={shades}
      empty={<TaxonomyEmpty noun="shades" query={query} />}
    />
  );
}
