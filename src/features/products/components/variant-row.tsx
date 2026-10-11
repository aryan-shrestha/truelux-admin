import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { showApiError } from "@/components/form/show-api-error";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { TableCell, TableRow } from "@/components/ui/table";
import { describeError } from "@/lib/repositories/errors";

import { useDeleteVariant, useSaveVariant } from "../queries/products.mutations";
import type { Variant } from "../schemas/product.schema";
import { VARIANT_FORM_SCHEMA, type VariantFormValues } from "../schemas/variant-form.schema";
import { toVariantBody } from "../variant-body";

type FormInput = z.input<typeof VARIANT_FORM_SCHEMA>;

// A Select item cannot have an empty value, so "no shade" needs a stand-in.
const NO_SHADE = "no-shade";

export interface SizeOption {
  id: string;
  name: string;
}

export interface ShadeOption {
  id: string;
  name: string;
  hex_code: string;
}

function toFormValues(variant: Variant | undefined): FormInput {
  return {
    sku: variant?.sku ?? "",
    size_id: variant?.size.id ?? "",
    shade_id: variant?.shade?.id ?? null,
    stock_quantity: variant?.stock_quantity ?? 0,
    price_override: variant?.price_override ?? "",
    compare_at_price: variant?.compare_at_price ?? "",
  };
}

function CellInput({
  control,
  name,
  label,
  placeholder,
  inputMode,
}: {
  control: Control<FormInput, unknown, VariantFormValues>;
  name: "sku" | "stock_quantity" | "price_override" | "compare_at_price";
  label: string;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Input
            {...field}
            aria-label={label}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete="off"
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

// One row of the variants table, with its own form: a saved variant (PATCH) or a
// draft (POST). Stock is an input only on a draft.
export function VariantRow({
  productId,
  basePrice,
  variant,
  label,
  sizes,
  shades,
  onDiscard,
  onCreated,
}: {
  productId: string;
  basePrice: string;
  variant?: Variant;
  label: string;
  sizes: readonly SizeOption[];
  shades: readonly ShadeOption[];
  onDiscard?: () => void;
  onCreated?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isNew = variant === undefined;
  const save = useSaveVariant(productId, variant?.id ?? null);
  const remove = useDeleteVariant(productId);
  // `values` keeps a saved row in step with the refetched product after a save.
  const form = useForm<FormInput, unknown, VariantFormValues>({
    resolver: zodResolver(VARIANT_FORM_SCHEMA),
    ...(isNew ? { defaultValues: toFormValues(undefined) } : { values: toFormValues(variant) }),
  });
  const rootError = form.formState.errors.root?.message;

  function handleSubmit(values: VariantFormValues) {
    save.mutate(toVariantBody(values, isNew), {
      onSuccess: () => {
        toast.success(isNew ? `${values.sku} added` : `${values.sku} saved`);
        onCreated?.();
      },
      onError: (error) =>
        showApiError(form, error, {
          conflict: "Another variant already has this SKU, or this size and shade.",
        }),
    });
  }

  function handleDelete() {
    if (variant === undefined) return;
    remove.mutate(variant.id, {
      onSuccess: () => {
        toast.success(`${variant.sku} deleted`);
        setIsDeleting(false);
      },
      onError: (error) => {
        setIsDeleting(false);
        toast.error(
          error.code === "conflict"
            ? `${variant.sku} has been ordered, so it cannot be deleted.`
            : describeError(error),
        );
      },
    });
  }

  return (
    <TableRow className="align-top">
      <TableCell className="min-w-40">
        <CellInput control={form.control} name="sku" label={`SKU of ${label}`} />
      </TableCell>
      <TableCell className="min-w-36">
        <Controller
          name="size_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger aria-label={`Size of ${label}`} aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </TableCell>
      <TableCell className="min-w-40">
        <Controller
          name="shade_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Select
                value={field.value ?? NO_SHADE}
                onValueChange={(value) => field.onChange(value === NO_SHADE ? null : value)}
              >
                <SelectTrigger aria-label={`Shade of ${label}`} aria-invalid={fieldState.invalid}>
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
      </TableCell>
      <TableCell className="w-28">
        {isNew ? (
          <CellInput
            control={form.control}
            name="stock_quantity"
            label={`Opening stock of ${label}`}
            inputMode="numeric"
          />
        ) : (
          <span className="block py-2 text-right tabular-nums">{variant.stock_quantity}</span>
        )}
      </TableCell>
      <TableCell className="w-36">
        <CellInput
          control={form.control}
          name="price_override"
          label={`Price of ${label}`}
          placeholder={basePrice}
          inputMode="decimal"
        />
      </TableCell>
      <TableCell className="w-36">
        <CellInput
          control={form.control}
          name="compare_at_price"
          label={`Compare-at price of ${label}`}
          inputMode="decimal"
        />
      </TableCell>
      <TableCell className="w-28">
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={isNew ? `Add ${label}` : `Save ${label}`}
            disabled={save.isPending || (!isNew && !form.formState.isDirty)}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {save.isPending ? <Spinner aria-hidden /> : <SaveIcon />}
          </Button>
          {isNew ? (
            <Button size="icon" variant="ghost" aria-label={`Discard ${label}`} onClick={onDiscard}>
              <XIcon />
            </Button>
          ) : (
            <ConfirmDialog
              trigger={
                <Button size="icon" variant="ghost" aria-label={`Delete ${label}`}>
                  <Trash2Icon />
                </Button>
              }
              title={`Delete ${variant.sku}?`}
              description="This cannot be undone."
              confirmLabel="Delete"
              isPending={remove.isPending}
              open={isDeleting}
              onOpenChange={setIsDeleting}
              onConfirm={handleDelete}
            />
          )}
        </div>
        {rootError && (
          <p role="alert" className="mt-1 text-right text-xs text-destructive">
            {rootError}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}
