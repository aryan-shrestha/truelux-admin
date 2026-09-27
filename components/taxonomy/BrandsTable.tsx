"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/DataTable";
import { slugColumn, sortOrderColumn, usageColumn } from "@/components/taxonomy/columns";
import { BrandDialog } from "@/components/taxonomy/BrandDialog";
import { RowActions } from "@/components/taxonomy/RowActions";
import { TaxonomyEmpty } from "@/components/taxonomy/TaxonomyEmpty";
import { useTaxonomySearch } from "@/components/taxonomy/use-taxonomy-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Brand } from "@/lib/api/types";

const COLUMNS: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand",
    cell: ({ row }) => (
      <span className="flex items-center gap-3">
        <Avatar className="rounded-md">
          {row.original.logo_url ? (
            <AvatarImage src={row.original.logo_url} alt="" className="object-contain" />
          ) : null}
          <AvatarFallback className="rounded-md">{row.original.name.charAt(0)}</AvatarFallback>
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
        <Badge variant="outline">Inactive</Badge>
      ),
  },
  sortOrderColumn<Brand>(),
  usageColumn<Brand>("product_count"),
  {
    id: "actions",
    meta: { className: "w-12 text-right" },
    cell: ({ row }) => (
      <RowActions
        kind="brands"
        id={row.original.id}
        name={row.original.name}
        inUseMessage={`In use by ${row.original.product_count} products. Deactivate or reassign first.`}
        editDialog={(state) => <BrandDialog brand={row.original} {...state} />}
      />
    ),
  },
];

export function BrandsTable() {
  const { items: brands, query } = useTaxonomySearch("brands");
  return (
    <DataTable
      columns={COLUMNS}
      data={brands}
      getRowId={(brand) => brand.id}
      empty={<TaxonomyEmpty noun="brands" query={query} />}
    />
  );
}
