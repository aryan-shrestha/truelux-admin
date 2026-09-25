"use client";

import { LayersIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import type { SelectOption } from "@/components/form/SelectField";
import { VariantRow } from "@/components/products/VariantRow";
import { ShadeDot } from "@/components/taxonomy/ShadeDot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Shade, Variant } from "@/lib/api/types";

type VariantsEditorProps = {
  productId: string;
  variants: Variant[];
  sizes: SelectOption[];
  shades: Pick<Shade, "id" | "name" | "hex_code">[];
};

export function VariantsEditor({ productId, variants, sizes, shades }: VariantsEditorProps) {
  const [drafts, setDrafts] = useState<string[]>(() =>
    variants.length === 0 ? [crypto.randomUUID()] : [],
  );
  const shadeOptions: SelectOption[] = shades.map((shade) => ({
    value: shade.id,
    label: shade.name,
    adornment: <ShadeDot hex={shade.hex_code} />,
  }));

  function addDraft() {
    setDrafts((current) => [...current, crypto.randomUUID()]);
  }

  function removeDraft(key: string) {
    setDrafts((current) => current.filter((draft) => draft !== key));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variants</CardTitle>
        <CardDescription>
          Each variant is one SKU with its own stock. Leave the price override blank to use the base
          price.
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={addDraft}>
            <PlusIcon data-icon="inline-start" />
            Add variant
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {variants.length === 0 && drafts.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayersIcon />
              </EmptyMedia>
              <EmptyTitle>No variants</EmptyTitle>
              <EmptyDescription>
                A product needs at least one variant before it can be published.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-40">SKU</TableHead>
                <TableHead className="min-w-32">Size</TableHead>
                <TableHead className="min-w-40">Shade</TableHead>
                <TableHead className="min-w-28">Stock</TableHead>
                <TableHead className="min-w-36">Price override (Rs)</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <VariantRow
                  key={variant.id}
                  productId={productId}
                  variant={variant}
                  sizes={sizes}
                  shades={shadeOptions}
                />
              ))}
              {drafts.map((key) => (
                <VariantRow
                  key={key}
                  productId={productId}
                  sizes={sizes}
                  shades={shadeOptions}
                  onDiscard={() => removeDraft(key)}
                  onCreated={() => removeDraft(key)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
