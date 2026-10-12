import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { ComboboxField } from "@/components/form/combobox-field";
import { showApiError } from "@/components/form/show-api-error";
import { TextField } from "@/components/form/text-field";
import { TextareaField } from "@/components/form/textarea-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

import { useChangeStock } from "../queries/products.mutations";
import type { Variant } from "../schemas/product.schema";
import {
  STOCK_CHANGE_OPTIONS,
  STOCK_CHANGE_SCHEMA,
  type StockChangeValues,
} from "../schemas/stock-change.schema";

type FormInput = z.input<typeof STOCK_CHANGE_SCHEMA>;

export function StockDialog({
  productId,
  variant,
  open,
  onOpenChange,
}: {
  productId: string;
  variant: Variant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change stock of {variant.sku}</DialogTitle>
          <DialogDescription>
            {variant.stock_quantity} in stock. Choose what happened; the change is kept in the stock
            history.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <StockForm productId={productId} variant={variant} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StockForm({
  productId,
  variant,
  onDone,
}: {
  productId: string;
  variant: Variant;
  onDone: () => void;
}) {
  const change = useChangeStock(productId, variant.id);
  const form = useForm<FormInput, unknown, StockChangeValues>({
    resolver: zodResolver(STOCK_CHANGE_SCHEMA),
    defaultValues: { kind: undefined, quantity: "", note: "" },
  });
  const isCount = useWatch({ control: form.control, name: "kind" }) === "count";
  const rootError = form.formState.errors.root?.message;

  function handleSubmit(values: StockChangeValues) {
    change.mutate(values, {
      onSuccess: () => {
        toast.success(`Stock of ${variant.sku} changed`);
        onDone();
      },
      onError: (error) => {
        // The API names its own field: quantity_change for an adjustment, stock_quantity
        // for a count. Both are the form's How many.
        const details = error.details;
        const message = details.quantity_change ?? details.stock_quantity;
        if (error.code === "validation_error" && Array.isArray(message)) {
          form.setError("quantity", { message: String(message[0]) });
          return;
        }
        showApiError(form, error, { not_found: "This variant no longer exists." });
      },
    });
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="flex min-h-0 flex-col gap-6"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <DialogBody>
          <FieldGroup>
            {rootError && (
              <Alert variant="destructive" aria-live="polite">
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}
            <ComboboxField
              name="kind"
              label="What happened"
              placeholder="Choose what happened"
              emptyMessage="No reasons match."
              options={STOCK_CHANGE_OPTIONS}
            />
            <TextField
              name="quantity"
              label={isCount ? "How many are on the shelf" : "How many"}
              inputMode="numeric"
              description={
                isCount
                  ? "This replaces the stock, so a sale made since you counted is lost. Save straight after counting."
                  : undefined
              }
            />
            {/* A count is the variant's new total; it carries no note. */}
            {!isCount && <TextareaField name="note" label="Note" description="Optional." />}
          </FieldGroup>
        </DialogBody>
        <DialogFooter>
          <Button type="submit" disabled={change.isPending}>
            {change.isPending && <Spinner aria-hidden data-icon="inline-start" />}
            Save change
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
