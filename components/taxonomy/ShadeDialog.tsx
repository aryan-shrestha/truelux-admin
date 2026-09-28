"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { NumberField } from "@/components/form/NumberField";
import { RecordDialog } from "@/components/form/RecordDialog";
import { NameSlugFields } from "@/components/taxonomy/NameSlugFields";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { Shade } from "@/lib/api/types";
import { HEX_PATTERN } from "@/lib/catalog/fields";
import { saveShade } from "@/lib/taxonomy/actions";
import { shadeSchema } from "@/lib/taxonomy/schemas";
import { afterTaxonomyChange } from "@/lib/query/invalidation";

type ShadeDialogProps = {
  shade?: Shade;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ShadeDialog({ shade, ...dialog }: ShadeDialogProps) {
  return (
    <RecordDialog
      {...dialog}
      title={shade ? `Edit ${shade.name}` : "New shade"}
      description="A shade is the colour a variant comes in. Variants may have none."
      submitLabel={shade ? "Save shade" : "Create shade"}
      successMessage={shade ? "Shade saved" : "Shade created"}
      schema={shadeSchema}
      defaultValues={{
        name: shade?.name ?? "",
        slug: shade?.slug ?? "",
        hex_code: shade?.hex_code ?? "#D8A47F",
        sort_order: shade?.sort_order ?? 0,
      }}
      action={(values) => saveShade(shade?.id ?? null, values)}
      invalidates={afterTaxonomyChange("shades")}
    >
      <NameSlugFields namePlaceholder="Warm Beige" />
      <HexField />
      <NumberField name="sort_order" label="Sort order" description="Lower numbers come first." />
    </RecordDialog>
  );
}

function HexField() {
  const { control } = useFormContext();

  return (
    <Controller
      name="hex_code"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="field-hex_code">Colour</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupInput
                type="color"
                aria-label="Pick the colour"
                className="size-6 cursor-pointer rounded-sm p-0"
                value={HEX_PATTERN.test(field.value) ? field.value.toLowerCase() : "#000000"}
                onChange={(event) => field.onChange(event.target.value.toUpperCase())}
              />
            </InputGroupAddon>
            <InputGroupInput
              {...field}
              id="field-hex_code"
              className="font-mono uppercase"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={fieldState.invalid}
            />
          </InputGroup>
          <FieldDescription>Six-digit hex, for example #D8A47F.</FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
