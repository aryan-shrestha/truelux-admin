import type { ReactNode } from "react";

import { SIZE_FORM_SCHEMA } from "../schemas/taxonomy-form.schema";
import type { Size } from "../schemas/taxonomy.schema";
import { toTaxonomyBody } from "../taxonomy-body";
import { NameSlugFields, SortOrderField } from "./form-fields";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";

export function SizeDialog({
  size,
  ...dialog
}: {
  size?: Size;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <TaxonomyFormDialog
      {...dialog}
      kind="sizes"
      entryId={size?.id ?? null}
      title={size ? `Edit ${size.name}` : "New size"}
      description="A size is the amount a variant holds, such as 30 ml."
      submitLabel={size ? "Save size" : "Create size"}
      savedMessage={size ? "Size saved" : "Size created"}
      schema={SIZE_FORM_SCHEMA}
      defaultValues={{
        name: size?.name ?? "",
        slug: size?.slug ?? "",
        sort_order: size?.sort_order ?? 0,
      }}
      toBody={toTaxonomyBody}
    >
      <NameSlugFields namePlaceholder="30 ml" />
      <SortOrderField />
    </TaxonomyFormDialog>
  );
}
