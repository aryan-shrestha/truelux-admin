import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { showApiError } from "@/components/form/show-api-error";
import { SwitchField } from "@/components/form/switch-field";
import { TextField } from "@/components/form/text-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/date";

import { settingsQueries } from "../queries/settings.queries";
import { useUpdateShippingSettings } from "../queries/settings.mutations";
import { SHIPPING_FORM_SCHEMA, type ShippingFormValues } from "../schemas/shipping-form.schema";
import type { ShippingSettings } from "../schemas/shipping-settings.schema";
import { toShippingBody } from "../shipping-body";

type FormInput = z.input<typeof SHIPPING_FORM_SCHEMA>;

function toFormValues(settings: ShippingSettings): FormInput {
  return {
    inside_valley_fee: settings.inside_valley_fee,
    outside_valley_fee: settings.outside_valley_fee,
    has_free_shipping: settings.free_shipping_threshold !== null,
    free_shipping_threshold: settings.free_shipping_threshold ?? "",
  };
}

export function ShippingSettingsForm() {
  const { data: settings } = useSuspenseQuery(settingsQueries.shipping());
  const update = useUpdateShippingSettings();
  const form = useForm<FormInput, unknown, ShippingFormValues>({
    resolver: zodResolver(SHIPPING_FORM_SCHEMA),
    defaultValues: toFormValues(settings),
  });
  const hasFreeShipping = useWatch({ control: form.control, name: "has_free_shipping" });
  const rootError = form.formState.errors.root?.message;

  function handleSubmit(values: ShippingFormValues) {
    update.mutate(toShippingBody(values), {
      onSuccess: (saved) => {
        toast.success("Shipping settings saved");
        form.reset(toFormValues(saved));
      },
      onError: (error) => showApiError(form, error),
    });
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardContent>
            <FieldGroup>
              {rootError && (
                <Alert variant="destructive" aria-live="polite">
                  <AlertDescription>{rootError}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">
                Changes apply to new orders straight away. Orders already placed keep the fee they
                were charged, and the storefront's banner catches up on its next refresh.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <TextField
                  name="inside_valley_fee"
                  label="Inside the valley"
                  prefix="Rs"
                  inputMode="decimal"
                />
                <TextField
                  name="outside_valley_fee"
                  label="Outside the valley"
                  prefix="Rs"
                  inputMode="decimal"
                />
              </div>
              <SwitchField
                name="has_free_shipping"
                label="Free shipping"
                description="Orders at or above the threshold ship free."
              />
              {/* Removed rather than disabled while off; its value is kept for turning
                  free shipping back on. */}
              {hasFreeShipping && (
                <TextField
                  name="free_shipping_threshold"
                  label="Free shipping from"
                  prefix="Rs"
                  inputMode="decimal"
                />
              )}
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-between gap-4 border-t">
            <span className="text-sm text-muted-foreground">
              Last updated {formatDateTime(settings.updated_at)}
            </span>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Spinner aria-hidden data-icon="inline-start" />}
              Save settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
