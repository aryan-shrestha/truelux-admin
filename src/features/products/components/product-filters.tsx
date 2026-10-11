import { useQuery } from "@tanstack/react-query";

import { SearchInput } from "@/components/data-table/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taxonomyQueries } from "@/features/taxonomy";

import type { ProductFilters as Filters } from "../schemas/product-filters.schema";

// A Select item cannot have an empty value, so "no filter" needs a stand-in.
const ANY = "any";

function FilterSelect<TValue extends string>({
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
    <Select
      value={value ?? ANY}
      // Every item's value but ANY comes from `options`.
      onValueChange={(next) => onChange(next === ANY ? undefined : (next as TValue))}
    >
      <SelectTrigger aria-label={label} className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{anyLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
      <FilterSelect
        label="Brand"
        anyLabel="All brands"
        value={filters.brand}
        options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
        onChange={(brand) => onFiltersChange({ brand })}
      />
      <FilterSelect
        label="Category"
        anyLabel="All categories"
        value={filters.category}
        options={categories.map((category) => ({ value: category.id, label: category.name }))}
        onChange={(category) => onFiltersChange({ category })}
      />
      <FilterSelect
        label="Status"
        anyLabel="Any status"
        value={filters.published}
        options={[
          { value: "yes", label: "Published" },
          { value: "no", label: "Draft" },
        ]}
        onChange={(published) => onFiltersChange({ published })}
      />
      <FilterSelect
        label="Stock"
        anyLabel="Any stock"
        value={filters.stock}
        options={[{ value: "low", label: "Low stock" }]}
        onChange={(stock) => onFiltersChange({ stock })}
      />
      <FilterSelect
        label="Price"
        anyLabel="Any price"
        value={filters.on_sale ? "true" : undefined}
        options={[{ value: "true", label: "On sale" }]}
        onChange={(onSale) => onFiltersChange({ on_sale: onSale === "true" ? true : undefined })}
      />
    </div>
  );
}
