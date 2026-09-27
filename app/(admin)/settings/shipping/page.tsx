import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";

import { ShippingSettingsForm } from "@/components/settings/ShippingSettingsForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { getShippingSettings } from "@/lib/api/settings";
import { getServerQueryClient } from "@/lib/query/server";
import { shippingSettingsQuery } from "@/lib/settings/queries";

export const metadata: Metadata = { title: "Shipping" };

export default async function ShippingSettingsPage() {
  const queryClient = getServerQueryClient();
  await queryClient.fetchQuery({
    ...shippingSettingsQuery,
    queryFn: () => getShippingSettings(),
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Settings" }, { label: "Shipping" }]}
        title="Shipping"
        description="What customers pay for delivery, and when it is free."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="max-w-3xl p-4 md:p-6">
          <ShippingSettingsForm />
        </div>
      </HydrationBoundary>
    </>
  );
}
