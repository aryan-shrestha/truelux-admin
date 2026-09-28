"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { FormProvider, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormRootError } from "@/components/form/FormRootError";
import { SwitchField } from "@/components/form/SwitchField";
import { TextField } from "@/components/form/TextField";
import { useActionForm } from "@/components/form/use-action-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { ShippingSettings } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format/date";
import { afterSettingsChange } from "@/lib/query/invalidation";
import { saveShippingSettings } from "@/lib/settings/actions";
import { shippingSettingsQuery } from "@/lib/settings/queries";
import { type ShippingSettingsValues, shippingSettingsSchema } from "@/lib/settings/schemas";

function toValues(settings: ShippingSettings): ShippingSettingsValues {
  return {
    inside_valley_fee: settings.inside_valley_fee,
    outside_valley_fee: settings.outside_valley_fee,
    has_free_shipping: settings.free_shipping_threshold !== null,
    free_shipping_threshold: settings.free_shipping_threshold ?? "",
  };
}

export function ShippingSettingsForm() {
  const { data: settings } = useSuspenseQuery(shippingSettingsQuery);
  const { form, submit, isPending, rootError } = useActionForm({
    schema: shippingSettingsSchema,
    defaultValues: toValues(settings),
    action: saveShippingSettings,
    invalidates: afterSettingsChange(),
    onSuccess: (saved) => {
      toast.success("Shipping settings saved");
      form.reset(toValues(saved));
    },
  });
  const hasFreeShipping = useWatch({ control: form.control, name: "has_free_shipping" });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>Shipping fees</CardTitle>
            <CardDescription>
              Changes apply to new orders immediately; placed orders keep the fee they were charged.
              The storefront&rsquo;s free-shipping banner catches up on its next refresh.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <FormRootError message={rootError} />
              <div className="grid gap-6 md:grid-cols-2">
                <TextField
                  name="inside_valley_fee"
                  label="Inside Kathmandu valley"
                  prefix="Rs"
                  inputMode="decimal"
                  autoComplete="off"
                  description="Kathmandu, Lalitpur and Bhaktapur."
                />
                <TextField
                  name="outside_valley_fee"
                  label="Outside the valley"
                  prefix="Rs"
                  inputMode="decimal"
                  autoComplete="off"
                  description="Every other district."
                />
              </div>
              <SwitchField
                name="has_free_shipping"
                label="Free shipping"
                description="Orders whose subtotal reaches the threshold ship free, anywhere."
              />
              {hasFreeShipping ? (
                <TextField
                  name="free_shipping_threshold"
                  label="Free shipping threshold"
                  prefix="Rs"
                  inputMode="decimal"
                  autoComplete="off"
                  description="The smallest subtotal that ships free."
                />
              ) : null}
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3 border-t">
            <p className="text-muted-foreground text-sm">
              Last updated {formatDateTime(settings.updated_at)}
            </p>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              Save settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
