"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { NumberField } from "@/components/form/NumberField";
import { RecordDialog } from "@/components/form/RecordDialog";
import { SelectField } from "@/components/form/SelectField";
import { NameSlugFields } from "@/components/taxonomy/NameSlugFields";
import type { Category } from "@/lib/api/types";
import { saveCategory } from "@/lib/taxonomy/actions";
import { categorySchema } from "@/lib/taxonomy/schemas";
import { taxonomyQuery } from "@/lib/taxonomy/queries";
import { afterTaxonomyChange } from "@/lib/query/invalidation";

type CategoryDialogProps = {
  category?: Category;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CategoryDialog({ category, ...dialog }: CategoryDialogProps) {
  const { data: roots } = useSuspenseQuery({
    ...taxonomyQuery("categories"),
    select: (categories) =>
      categories
        .filter((root) => root.parent_id === null && root.id !== category?.id)
        .map((root) => ({ value: root.id, label: root.name })),
  });

  return (
    <RecordDialog
      {...dialog}
      title={category ? `Edit ${category.name}` : "New category"}
      description="Categories nest one level: a top-level category and its children."
      submitLabel={category ? "Save category" : "Create category"}
      successMessage={category ? "Category saved" : "Category created"}
      schema={categorySchema}
      defaultValues={{
        name: category?.name ?? "",
        slug: category?.slug ?? "",
        parent_id: category?.parent_id ?? null,
        sort_order: category?.sort_order ?? 0,
      }}
      action={(values) => saveCategory(category?.id ?? null, values)}
      invalidates={afterTaxonomyChange("categories")}
    >
      <NameSlugFields namePlaceholder="Face" />
      <SelectField name="parent_id" label="Parent" noneLabel="None (top level)" options={roots} />
      <NumberField name="sort_order" label="Sort order" description="Lower numbers come first." />
    </RecordDialog>
  );
}
