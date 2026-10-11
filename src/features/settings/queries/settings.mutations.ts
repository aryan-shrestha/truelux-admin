import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateShippingSettings } from "../repositories/shipping-settings.repository";
import { settingsKeys } from "./settings.queries";

// The PATCH answers with the saved settings, so they replace the cached ones; nothing
// else in the admin shows shipping fees.
export function useUpdateShippingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: object) => updateShippingSettings(body),
    onSuccess: (settings) => queryClient.setQueryData(settingsKeys.shipping(), settings),
  });
}
