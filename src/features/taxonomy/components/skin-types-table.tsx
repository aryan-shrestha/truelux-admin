import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";

import type { SkinType } from "../schemas/taxonomy.schema";
import { useTaxonomySearch } from "../use-taxonomy-search";
import { slugColumn, sortOrderColumn, usageColumn } from "./columns";
import { RowActions } from "./row-actions";
import { SkinTypeDialog } from "./skin-type-dialog";
import { TaxonomyEmpty } from "./taxonomy-empty";

// Deleting a skin type in use detaches it from its products (the API answers 204), so
// the confirmation says how many products lose it.
function deleteDescription(productCount: number): string {
  return productCount === 0
    ? "This cannot be undone."
    : `Removes it from ${productCount} ${productCount === 1 ? "product" : "products"}. This cannot be undone.`;
}

const COLUMNS: ColumnDef<SkinType>[] = [
  {
    accessorKey: "name",
    header: "Skin type",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  slugColumn<SkinType>(),
  sortOrderColumn<SkinType>(),
  usageColumn<SkinType, "product_count">("product_count", "Products"),
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <RowActions
          kind="skin-types"
          id={row.original.id}
          name={row.original.name}
          inUseMessage="This skin type could not be deleted."
          deleteDescription={deleteDescription(row.original.product_count)}
          editDialog={(state) => <SkinTypeDialog skinType={row.original} {...state} />}
        />
      </div>
    ),
  },
];

export function SkinTypesTable({ query }: { query: string | undefined }) {
  const skinTypes = useTaxonomySearch("skin-types", query);
  return (
    <DataTable
      columns={COLUMNS}
      data={skinTypes}
      empty={<TaxonomyEmpty noun="skin types" query={query} />}
    />
  );
}
