import { useQuery } from "@tanstack/react-query";

import { SearchInput } from "@/components/data-table/search-input";
import { Combobox } from "@/components/form/combobox";
import { taxonomyQueries } from "@/features/taxonomy";

import type { ProductFilters as Filters } from "../schemas/product-filters.schema";

function FilterCombobox<TValue extends string>({
  label,
  anyLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  anyLabel: string;
  value: TValue | undefined;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue | undefined) => void;
}) {
  return (
    <Combobox
      aria-label={label}
      value={value ?? ""}
      options={[{ value: "", label: anyLabel }, ...options]}
      searchPlaceholder={`Search ${label.toLowerCase()}`}
      emptyMessage="No matches."
      className="w-44"
      // Every value but "" comes from `options`.
      onChange={(next) => onChange(next === "" ? undefined : (next as TValue))}
    />
  );
}

export function ProductFilters({
  filters,
  onFiltersChange,
}: {
  filters: Filters;
  onFiltersChange: (change: Partial<Filters>) => void;
}) {
  const { data: brands = [] } = useQuery(taxonomyQueries.list("brands"));
  const { data: categories = [] } = useQuery(taxonomyQueries.list("categories"));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        label="Search name or SKU"
        value={filters.q}
        onSearch={(q) => onFiltersChange({ q: q || undefined })}
      />
      <FilterCombobox
        label="Brand"
        anyLabel="All brands"
        value={filters.brand}
        options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
        onChange={(brand) => onFiltersChange({ brand })}
      />
      <FilterCombobox
        label="Category"
        anyLabel="All categories"
        value={filters.category}
        options={categories.map((category) => ({ value: category.id, label: category.name }))}
        onChange={(category) => onFiltersChange({ category })}
      />
      <FilterCombobox
        label="Status"
        anyLabel="Any status"
        value={filters.published}
        options={[
          { value: "yes", label: "Published" },
          { value: "no", label: "Draft" },
        ]}
        onChange={(published) => onFiltersChange({ published })}
      />
      <FilterCombobox
        label="Stock"
        anyLabel="Any stock"
        value={filters.stock}
        options={[{ value: "low", label: "Low stock" }]}
        onChange={(stock) => onFiltersChange({ stock })}
      />
      <FilterCombobox
        label="Price"
        anyLabel="Any price"
        value={filters.on_sale ? "true" : undefined}
        options={[{ value: "true", label: "On sale" }]}
        onChange={(onSale) => onFiltersChange({ on_sale: onSale === "true" ? true : undefined })}
      />
    </div>
  );
}
