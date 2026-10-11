import type { ShippingFormValues } from "./schemas/shipping-form.schema";

// Free shipping off is a null threshold, whatever the threshold field still holds.
export function toShippingBody(values: ShippingFormValues) {
  return {
    inside_valley_fee: values.inside_valley_fee,
    outside_valley_fee: values.outside_valley_fee,
    free_shipping_threshold: values.has_free_shipping ? values.free_shipping_threshold : null,
  };
}
