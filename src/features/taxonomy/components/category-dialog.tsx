import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { taxonomyQueries } from "../queries/taxonomy.queries";
import { CATEGORY_FORM_SCHEMA } from "../schemas/taxonomy-form.schema";
import type { Category } from "../schemas/taxonomy.schema";
import { toTaxonomyBody } from "../taxonomy-body";
import { NameSlugFields, SortOrderField } from "./form-fields";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";

// A Select item cannot have an empty value, so "no parent" needs a stand-in.
const TOP_LEVEL = "top-level";

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
  const { control } = useFormContext();
  const { data: categories = [] } = useQuery(taxonomyQueries.list("categories"));
  const parents = categories.filter(
    (category) => category.parent_id === null && category.id !== categoryId,
  );

  return (
    <Controller
      name="parent_id"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="field-parent_id">Parent</FieldLabel>
          <Select
            value={field.value ?? TOP_LEVEL}
            onValueChange={(value) => field.onChange(value === TOP_LEVEL ? null : value)}
          >
            <SelectTrigger id="field-parent_id" aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TOP_LEVEL}>None (top level)</SelectItem>
              {parents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Only top-level categories can be parents.</FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
