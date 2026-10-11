import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

import { HEX_PATTERN, SHADE_FORM_SCHEMA } from "../schemas/taxonomy-form.schema";
import type { Shade } from "../schemas/taxonomy.schema";
import { toShadeBody } from "../taxonomy-body";
import { NameSlugFields, SortOrderField } from "./form-fields";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";

export function ShadeDialog({
  shade,
  ...dialog
}: {
  shade?: Shade;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <TaxonomyFormDialog
      {...dialog}
      kind="shades"
      entryId={shade?.id ?? null}
      title={shade ? `Edit ${shade.name}` : "New shade"}
      description="A shade is the colour a variant comes in. Variants may have none."
      submitLabel={shade ? "Save shade" : "Create shade"}
      savedMessage={shade ? "Shade saved" : "Shade created"}
      schema={SHADE_FORM_SCHEMA}
      defaultValues={{
        name: shade?.name ?? "",
        slug: shade?.slug ?? "",
        hex_code: shade?.hex_code ?? "#D8A47F",
        sort_order: shade?.sort_order ?? 0,
      }}
      toBody={toShadeBody}
    >
      <NameSlugFields namePlaceholder="Warm Beige" />
      <HexField />
      <SortOrderField />
    </TaxonomyFormDialog>
  );
}

// The colour picker and the hex text edit the same value.
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
              <input
                type="color"
                aria-label="Pick the colour"
                className="size-6 cursor-pointer rounded-sm border-0 bg-transparent p-0"
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
