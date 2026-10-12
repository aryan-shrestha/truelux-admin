import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { showApiError } from "@/components/form/show-api-error";
import { TextField } from "@/components/form/text-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { taxonomyQueries } from "@/features/taxonomy";

import { useSaveVariant } from "../queries/products.mutations";
import type { Variant } from "../schemas/product.schema";
import { VARIANT_FORM_SCHEMA, type VariantFormValues } from "../schemas/variant-form.schema";
import { toVariantBody } from "../variant-body";
import { SelectField } from "./select-field";

type FormInput = z.input<typeof VARIANT_FORM_SCHEMA>;

// A Select item cannot have an empty value, so "no shade" needs a stand-in.
const NO_SHADE = "no-shade";

// Adds a variant (POST) or edits a saved one (PATCH). Stock is an input only when
// adding; a saved variant's stock changes through Change stock.
export function VariantSheet({
  productId,
  basePrice,
  variant,
  open,
  onOpenChange,
}: {
  productId: string;
  basePrice: string;
  variant?: Variant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{variant ? `Edit ${variant.sku}` : "New variant"}</SheetTitle>
          <SheetDescription>
            A blank price uses the base price. Enter a compare-at price above the price to put the
            variant on sale.
          </SheetDescription>
        </SheetHeader>
        {/* Mounted only while open, so an edit always starts from the saved variant. */}
        {open && (
          <VariantForm
            productId={productId}
            basePrice={basePrice}
            variant={variant}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function VariantForm({
  productId,
  basePrice,
  variant,
  onSaved,
}: {
  productId: string;
  basePrice: string;
  variant: Variant | undefined;
  onSaved: () => void;
}) {
  const isNew = variant === undefined;
  const { data: sizes = [] } = useQuery(taxonomyQueries.list("sizes"));
  const save = useSaveVariant(productId, variant?.id ?? null);
  const form = useForm<FormInput, unknown, VariantFormValues>({
    resolver: zodResolver(VARIANT_FORM_SCHEMA),
    defaultValues: {
      sku: variant?.sku ?? "",
      size_id: variant?.size.id ?? "",
      shade_id: variant?.shade?.id ?? null,
      stock_quantity: variant?.stock_quantity ?? 0,
      price_override: variant?.price_override ?? "",
      compare_at_price: variant?.compare_at_price ?? "",
    },
  });
  const rootError = form.formState.errors.root?.message;

  function handleSubmit(values: VariantFormValues) {
    save.mutate(toVariantBody(values, isNew), {
      onSuccess: () => {
        toast.success(isNew ? `${values.sku} added` : `${values.sku} saved`);
        onSaved();
      },
      onError: (error) =>
        showApiError(form, error, {
          conflict: "Another variant already has this SKU, or this size and shade.",
        }),
    });
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FieldGroup className="overflow-y-auto px-4">
          {rootError && (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}
          <TextField name="sku" label="SKU" />
          <SelectField
            name="size_id"
            label="Size"
            placeholder="Choose"
            options={sizes.map((size) => ({ value: size.id, label: size.name }))}
          />
          <ShadeField />
          {isNew && <TextField name="stock_quantity" label="Opening stock" inputMode="numeric" />}
          <TextField
            name="price_override"
            label="Price override"
            prefix="Rs"
            placeholder={basePrice}
            inputMode="decimal"
          />
          <TextField
            name="compare_at_price"
            label="Compare-at price"
            prefix="Rs"
            placeholder="Not on sale"
            inputMode="decimal"
          />
        </FieldGroup>
        <SheetFooter>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Spinner aria-hidden data-icon="inline-start" />}
            {isNew ? "Add variant" : "Save variant"}
          </Button>
        </SheetFooter>
      </form>
    </FormProvider>
  );
}

function ShadeField() {
  const { control } = useFormContext<FormInput>();
  const { data: shades = [] } = useQuery(taxonomyQueries.list("shades"));

  return (
    <Controller
      name="shade_id"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="field-shade_id">Shade</FieldLabel>
          <Select
            value={field.value ?? NO_SHADE}
            onValueChange={(value) => field.onChange(value === NO_SHADE ? null : value)}
          >
            <SelectTrigger id="field-shade_id" aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SHADE}>No shade</SelectItem>
              {shades.map((shade) => (
                <SelectItem key={shade.id} value={shade.id}>
                  <span
                    aria-hidden
                    className="size-3 rounded-sm border"
                    style={{ backgroundColor: shade.hex_code }}
                  />
                  {shade.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
