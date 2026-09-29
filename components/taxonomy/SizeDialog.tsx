"use client";

import type { ReactNode } from "react";

import { NumberField } from "@/components/form/NumberField";
import { RecordDialog } from "@/components/form/RecordDialog";
import { NameSlugFields } from "@/components/taxonomy/NameSlugFields";
import type { Size } from "@/lib/api/types";
import { saveSize } from "@/lib/taxonomy/actions";
import { sizeSchema } from "@/lib/taxonomy/schemas";
import { afterTaxonomyChange } from "@/lib/query/invalidation";

type SizeDialogProps = {
  size?: Size;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SizeDialog({ size, ...dialog }: SizeDialogProps) {
  return (
    <RecordDialog
      {...dialog}
      title={size ? `Edit ${size.name}` : "New size"}
      description="A size is the volume or weight a variant is sold in."
      submitLabel={size ? "Save size" : "Create size"}
      successMessage={size ? "Size saved" : "Size created"}
      schema={sizeSchema}
      defaultValues={{
        name: size?.name ?? "",
        slug: size?.slug ?? "",
        sort_order: size?.sort_order ?? 0,
      }}
      action={(values) => saveSize(size?.id ?? null, values)}
      invalidates={afterTaxonomyChange("sizes")}
    >
      <NameSlugFields namePlaceholder="30 ml" />
      <NumberField name="sort_order" label="Sort order" description="Lower numbers come first." />
    </RecordDialog>
  );
}
