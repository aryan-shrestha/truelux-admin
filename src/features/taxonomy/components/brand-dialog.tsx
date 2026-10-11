import { useEffect, useState, type ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { SwitchField } from "@/components/form/switch-field";
import { TextareaField } from "@/components/form/textarea-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { IMAGE_ACCEPT } from "@/lib/image-upload";

import { BRAND_FORM_SCHEMA } from "../schemas/taxonomy-form.schema";
import type { Brand } from "../schemas/taxonomy.schema";
import { toBrandBody } from "../taxonomy-body";
import { NameSlugFields, SortOrderField } from "./form-fields";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";

export function BrandDialog({
  brand,
  ...dialog
}: {
  brand?: Brand;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <TaxonomyFormDialog
      {...dialog}
      kind="brands"
      entryId={brand?.id ?? null}
      title={brand ? `Edit ${brand.name}` : "New brand"}
      description="Inactive brands and their products are hidden from the storefront."
      submitLabel={brand ? "Save brand" : "Create brand"}
      savedMessage={brand ? "Brand saved" : "Brand created"}
      schema={BRAND_FORM_SCHEMA}
      defaultValues={{
        name: brand?.name ?? "",
        slug: brand?.slug ?? "",
        description: brand?.description ?? "",
        logo: null,
        is_active: brand?.is_active ?? true,
        sort_order: brand?.sort_order ?? 0,
      }}
      toBody={toBrandBody}
    >
      <NameSlugFields namePlaceholder="Lumière" />
      <TextareaField name="description" label="Description" />
      <LogoField currentUrl={brand?.logo_url ?? null} name={brand?.name ?? "New brand"} />
      <SwitchField name="is_active" label="Active" description="Shown on the storefront." />
      <SortOrderField />
    </TaxonomyFormDialog>
  );
}

function LogoField({ currentUrl, name }: { currentUrl: string | null; name: string }) {
  const { control } = useFormContext();
  const [previewUrl, setPreviewUrl] = useState(currentUrl);

  // A chosen file is previewed from an object URL, released when it is replaced or the
  // dialog closes.
  useEffect(
    () => () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  return (
    <Controller
      name="logo"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="field-logo">Logo</FieldLabel>
          <div className="flex items-center gap-3">
            <Avatar className="size-12 rounded-md">
              {previewUrl && <AvatarImage src={previewUrl} alt="" className="object-contain" />}
              <AvatarFallback className="rounded-md">{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Input
              id="field-logo"
              type="file"
              accept={IMAGE_ACCEPT}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setPreviewUrl(file ? URL.createObjectURL(file) : currentUrl);
                field.onChange(file);
              }}
            />
          </div>
          <FieldDescription>
            JPEG, PNG or WebP, up to 5 MB. Leave empty to keep the current logo.
          </FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
