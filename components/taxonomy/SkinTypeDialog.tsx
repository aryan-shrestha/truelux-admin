"use client";

import type { ReactNode } from "react";

import { NumberField } from "@/components/form/NumberField";
import { RecordDialog } from "@/components/form/RecordDialog";
import { NameSlugFields } from "@/components/taxonomy/NameSlugFields";
import type { SkinType } from "@/lib/api/types";
import { saveSkinType } from "@/lib/taxonomy/actions";
import { skinTypeSchema } from "@/lib/taxonomy/schemas";

type SkinTypeDialogProps = {
  skinType?: SkinType;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SkinTypeDialog({ skinType, ...dialog }: SkinTypeDialogProps) {
  return (
    <RecordDialog
      {...dialog}
      title={skinType ? `Edit ${skinType.name}` : "New skin type"}
      description="Customers shop by skin type, and a product lists the ones it suits."
      submitLabel={skinType ? "Save skin type" : "Create skin type"}
      successMessage={skinType ? "Skin type saved" : "Skin type created"}
      schema={skinTypeSchema}
      defaultValues={{
        name: skinType?.name ?? "",
        slug: skinType?.slug ?? "",
        sort_order: skinType?.sort_order ?? 0,
      }}
      action={(values) => saveSkinType(skinType?.id ?? null, values)}
    >
      <NameSlugFields namePlaceholder="Combination" />
      <NumberField name="sort_order" label="Sort order" description="Lower numbers come first." />
    </RecordDialog>
  );
}
