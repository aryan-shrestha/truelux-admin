import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import type { Brand } from "../schemas/taxonomy.schema";
import { useTaxonomySearch } from "../use-taxonomy-search";
import { BrandDialog } from "./brand-dialog";
import { slugColumn, sortOrderColumn, usageColumn } from "./columns";
import { RowActions } from "./row-actions";
import { TaxonomyEmpty } from "./taxonomy-empty";

const COLUMNS: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand",
    cell: ({ row }) => (
      <span className="flex items-center gap-3">
        <Avatar className="size-8 rounded-md">
          {row.original.logo_url && (
            <AvatarImage src={row.original.logo_url} alt="" className="object-contain" />
          )}
          <AvatarFallback className="rounded-md text-xs">
            {row.original.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{row.original.name}</span>
      </span>
    ),
  },
  slugColumn<Brand>(),
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) =>
      row.original.is_active ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
  },
  sortOrderColumn<Brand>(),
  usageColumn<Brand, "product_count">("product_count", "Products"),
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <RowActions
          kind="brands"
          id={row.original.id}
          name={row.original.name}
          inUseMessage={`In use by ${row.original.product_count} products. Deactivate or reassign them first.`}
          editDialog={(state) => <BrandDialog brand={row.original} {...state} />}
        />
      </div>
    ),
  },
];

export function BrandsTable({ query }: { query: string | undefined }) {
  const brands = useTaxonomySearch("brands", query);
  return (
    <DataTable
      columns={COLUMNS}
      data={brands}
      empty={<TaxonomyEmpty noun="brands" query={query} />}
    />
  );
}
