import type { ReactNode } from "react";

import { SKIN_TYPE_FORM_SCHEMA } from "../schemas/taxonomy-form.schema";
import type { SkinType } from "../schemas/taxonomy.schema";
import { toTaxonomyBody } from "../taxonomy-body";
import { NameSlugFields, SortOrderField } from "./form-fields";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";

export function SkinTypeDialog({
  skinType,
  ...dialog
}: {
  skinType?: SkinType;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <TaxonomyFormDialog
      {...dialog}
      kind="skin-types"
      entryId={skinType?.id ?? null}
      title={skinType ? `Edit ${skinType.name}` : "New skin type"}
      description="Products list the skin types they suit; shoppers filter by them."
      submitLabel={skinType ? "Save skin type" : "Create skin type"}
      savedMessage={skinType ? "Skin type saved" : "Skin type created"}
      schema={SKIN_TYPE_FORM_SCHEMA}
      defaultValues={{
        name: skinType?.name ?? "",
        slug: skinType?.slug ?? "",
        sort_order: skinType?.sort_order ?? 0,
      }}
      toBody={toTaxonomyBody}
    >
      <NameSlugFields namePlaceholder="Oily" />
      <SortOrderField />
    </TaxonomyFormDialog>
  );
}
