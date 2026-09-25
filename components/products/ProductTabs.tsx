"use client";

import type { ReactNode } from "react";

import { useUrlParams } from "@/components/data-table/use-url-params";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProductTab } from "@/lib/products/query";

type ProductTabsProps = {
  tab: ProductTab;
  details: ReactNode;
  variants: ReactNode;
  images: ReactNode;
  variantCount: number;
  imageCount: number;
};

export function ProductTabs({
  tab,
  details,
  variants,
  images,
  variantCount,
  imageCount,
}: ProductTabsProps) {
  const { update } = useUrlParams();

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => update({ tab: value === "details" ? null : value })}
    >
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="variants">Variants ({variantCount})</TabsTrigger>
        <TabsTrigger value="images">Images ({imageCount})</TabsTrigger>
      </TabsList>
      <TabsContent value="details">{details}</TabsContent>
      <TabsContent value="variants">{variants}</TabsContent>
      <TabsContent value="images">{images}</TabsContent>
    </Tabs>
  );
}
