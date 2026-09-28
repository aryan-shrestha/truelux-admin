"use client";

import { SaveIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { Controller, type Control } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/form/ConfirmAction";
import type { SelectOption } from "@/components/form/SelectField";
import { useActionForm } from "@/components/form/use-action-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Variant } from "@/lib/api/types";
import { addVariant, removeVariant, saveVariant } from "@/lib/products/actions";
import { afterVariantChange } from "@/lib/query/invalidation";
import { type VariantInput, type VariantValues, variantSchema } from "@/lib/products/schemas";

const NO_SHADE = "__none";

type VariantRowProps = {
  productId: string;
  variant?: Variant;
  sizes: SelectOption[];
  shades: SelectOption[];
  onDiscard?: () => void;
  onCreated?: () => void;
};

export function VariantRow({
  productId,
  variant,
  sizes,
  shades,
  onDiscard,
  onCreated,
}: VariantRowProps) {
  const [deleting, setDeleting] = useState(false);
  const label = variant?.sku ?? "new variant";
  const invalidates = afterVariantChange(productId);
  const { form, submit, isPending, rootError } = useActionForm({
    schema: variantSchema,
    defaultValues: {
      sku: variant?.sku ?? "",
      size_id: variant?.size.id ?? "",
      shade_id: variant?.shade?.id ?? null,
      stock_quantity: variant?.stock_quantity ?? 0,
      price_override: variant?.price_override ?? null,
      compare_at_price: variant?.compare_at_price ?? null,
    },
    action: (values) => (variant ? saveVariant(variant.id, values) : addVariant(productId, values)),
    invalidates,
    onSuccess: (saved) => {
      toast.success(variant ? `${saved.sku} saved` : `${saved.sku} added`);
      form.reset(form.getValues());
      onCreated?.();
    },
  });
  const control: Control<VariantInput, unknown, VariantValues> = form.control;

  return (
    <TableRow className="align-top">
      <TableCell>
        <Controller
          name="sku"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                aria-label={`SKU of ${label}`}
                aria-invalid={fieldState.invalid}
                className="font-mono"
                spellCheck={false}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          name="size_id"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  aria-label={`Size of ${label}`}
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          name="shade_id"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? NO_SHADE}
              onValueChange={(value) => field.onChange(value === NO_SHADE ? null : value)}
            >
              <SelectTrigger aria-label={`Shade of ${label}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={NO_SHADE}>No shade</SelectItem>
                  {shades.map((shade) => (
                    <SelectItem key={shade.value} value={shade.value}>
                      {shade.adornment}
                      {shade.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          name="stock_quantity"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                aria-label={`Stock of ${label}`}
                aria-invalid={fieldState.invalid}
                className="w-24 text-right"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={Number.isNaN(field.value) ? "" : field.value}
                onChange={(event) => field.onChange(event.target.valueAsNumber)}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          name="price_override"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                value={field.value ?? ""}
                inputMode="decimal"
                placeholder="Base price"
                aria-label={`Price override of ${label}`}
                aria-invalid={fieldState.invalid}
                className="w-28 text-right"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          name="compare_at_price"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                value={field.value ?? ""}
                inputMode="decimal"
                placeholder="Not on sale"
                aria-label={`Compare-at price of ${label}`}
                aria-invalid={fieldState.invalid}
                className="w-28 text-right"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            size="icon-sm"
            variant={form.formState.isDirty || !variant ? "default" : "ghost"}
            disabled={isPending || (variant && !form.formState.isDirty)}
            aria-label={variant ? `Save ${label}` : "Add this variant"}
            onClick={submit}
          >
            {isPending ? <Spinner /> : <SaveIcon />}
          </Button>
          {variant ? (
            <ConfirmAction
              open={deleting}
              onOpenChange={setDeleting}
              trigger={
                <Button size="icon-sm" variant="ghost" aria-label={`Delete ${label}`}>
                  <Trash2Icon />
                </Button>
              }
              title={`Delete ${label}?`}
              description="The variant and its stock are removed. This cannot be undone."
              confirmLabel="Delete variant"
              successMessage={`${label} deleted`}
              action={() => removeVariant(variant.id)}
              invalidates={invalidates}
              onFailure={(failure) =>
                toast.error(
                  failure.code === "conflict"
                    ? `${label} has been ordered, so it cannot be deleted. Set its stock to 0 instead.`
                    : failure.message,
                )
              }
            />
          ) : (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Discard this variant"
              onClick={onDiscard}
            >
              <XIcon />
            </Button>
          )}
        </div>
        {rootError ? (
          <p role="alert" className="text-destructive mt-1 text-xs">
            {rootError}
          </p>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
