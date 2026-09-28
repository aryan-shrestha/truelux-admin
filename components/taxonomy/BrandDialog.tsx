"use client";

import { type ReactNode, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { NumberField } from "@/components/form/NumberField";
import { RecordDialog } from "@/components/form/RecordDialog";
import { SwitchField } from "@/components/form/SwitchField";
import { TextareaField } from "@/components/form/TextareaField";
import { NameSlugFields } from "@/components/taxonomy/NameSlugFields";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Brand } from "@/lib/api/types";
import { saveBrand } from "@/lib/taxonomy/actions";
import { brandSchema } from "@/lib/taxonomy/schemas";
import { afterTaxonomyChange } from "@/lib/query/invalidation";

type BrandDialogProps = {
  brand?: Brand;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function BrandDialog({ brand, ...dialog }: BrandDialogProps) {
  return (
    <RecordDialog
      {...dialog}
      title={brand ? `Edit ${brand.name}` : "New brand"}
      description="Inactive brands and their products are hidden from the storefront."
      submitLabel={brand ? "Save brand" : "Create brand"}
      successMessage={brand ? "Brand saved" : "Brand created"}
      schema={brandSchema}
      defaultValues={{
        name: brand?.name ?? "",
        slug: brand?.slug ?? "",
        description: brand?.description ?? "",
        is_active: brand?.is_active ?? true,
        sort_order: brand?.sort_order ?? 0,
        logo: null,
      }}
      action={(values) => saveBrand(brand?.id ?? null, values)}
      invalidates={afterTaxonomyChange("brands")}
    >
      <NameSlugFields namePlaceholder="Lumière" />
      <TextareaField name="description" label="Description" />
      <LogoField currentUrl={brand?.logo_url ?? null} name={brand?.name ?? "New brand"} />
      <SwitchField name="is_active" label="Active" description="Shown on the storefront." />
      <NumberField name="sort_order" label="Sort order" description="Lower numbers come first." />
    </RecordDialog>
  );
}

function LogoField({ currentUrl, name }: { currentUrl: string | null; name: string }) {
  const { control } = useFormContext();
  const [previewUrl, setPreviewUrl] = useState(currentUrl);

  return (
    <Controller
      name="logo"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="field-logo">Logo</FieldLabel>
          <div className="flex items-center gap-3">
            <Avatar className="size-12 rounded-md">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt="" className="object-contain" />
              ) : null}
              <AvatarFallback className="rounded-md">{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Input
              id="field-logo"
              type="file"
              accept="image/*"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(file ? URL.createObjectURL(file) : currentUrl);
                field.onChange(file);
              }}
            />
          </div>
          <FieldDescription>Leave empty to keep the current logo.</FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
