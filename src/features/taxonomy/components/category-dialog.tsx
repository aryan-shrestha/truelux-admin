import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ComboboxField } from "@/components/form/combobox-field";

import { taxonomyQueries } from "../queries/taxonomy.queries";
import { CATEGORY_FORM_SCHEMA } from "../schemas/taxonomy-form.schema";
import type { Category } from "../schemas/taxonomy.schema";
import { toTaxonomyBody } from "../taxonomy-body";
import { NameSlugFields, SortOrderField } from "./form-fields";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";

export function CategoryDialog({
  category,
  ...dialog
}: {
  category?: Category;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <TaxonomyFormDialog
      {...dialog}
      kind="categories"
      entryId={category?.id ?? null}
      title={category ? `Edit ${category.name}` : "New category"}
      description="A category stands on its own or sits under a top-level category."
      submitLabel={category ? "Save category" : "Create category"}
      savedMessage={category ? "Category saved" : "Category created"}
      schema={CATEGORY_FORM_SCHEMA}
      defaultValues={{
        name: category?.name ?? "",
        slug: category?.slug ?? "",
        parent_id: category?.parent_id ?? null,
        sort_order: category?.sort_order ?? 0,
      }}
      toBody={toTaxonomyBody}
    >
      <NameSlugFields namePlaceholder="Foundation" />
      <ParentField categoryId={category?.id} />
      <SortOrderField />
    </TaxonomyFormDialog>
  );
}

function ParentField({ categoryId }: { categoryId: string | undefined }) {
  const { data: categories = [] } = useQuery(taxonomyQueries.list("categories"));
  const parents = categories.filter(
    (category) => category.parent_id === null && category.id !== categoryId,
  );

  return (
    <ComboboxField
      name="parent_id"
      label="Parent"
      description="Only top-level categories can be parents."
      emptyMessage="No categories match."
      noneLabel="None (top level)"
      options={parents.map((parent) => ({ value: parent.id, label: parent.name }))}
    />
  );
}
