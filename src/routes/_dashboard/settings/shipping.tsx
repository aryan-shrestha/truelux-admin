import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { settingsQueries, ShippingSettingsForm } from "@/features/settings";

export const Route = createFileRoute("/_dashboard/settings/shipping")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQueries.shipping()),
  component: ShippingSettingsPage,
});

function ShippingSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Settings" }, { label: "Shipping" }]} title="Shipping" />
      <ShippingSettingsForm />
    </div>
  );
}
