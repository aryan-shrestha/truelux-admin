import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { settingsQueries, ShippingSettingsForm } from "@/features/settings";

export const Route = createFileRoute("/_dashboard/settings/shipping")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQueries.shipping()),
  component: ShippingSettingsPage,
});

function ShippingSettingsPage() {
  return (
    <Page>
      <PageHeader crumbs={[{ label: "Settings" }, { label: "Shipping" }]} title="Shipping" />
      <ShippingSettingsForm />
    </Page>
  );
}
