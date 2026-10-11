import { useQuery } from "@tanstack/react-query";
import { BoxesIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { taxonomyQueries } from "@/features/taxonomy";
import { formatMoney } from "@/lib/money";

import type { Product } from "../schemas/product.schema";
import { VariantRow } from "./variant-row";

export function VariantsEditor({ product }: { product: Product }) {
  const { data: sizes = [] } = useQuery(taxonomyQueries.list("sizes"));
  const { data: shades = [] } = useQuery(taxonomyQueries.list("shades"));
  // Unsaved rows, numbered so each keeps its own form and label.
  const [drafts, setDrafts] = useState<number[]>([]);
  const [nextDraft, setNextDraft] = useState(1);

  function addDraft() {
    setDrafts((current) => [...current, nextDraft]);
    setNextDraft((current) => current + 1);
  }

  function removeDraft(draft: number) {
    setDrafts((current) => current.filter((item) => item !== draft));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variants</CardTitle>
        <CardDescription>
          Each size and shade a product comes in. A blank price uses the base price,{" "}
          {formatMoney(product.base_price)}. Opening stock is set when a variant is added.
        </CardDescription>
        <CardAction>
          <Button variant="outline" onClick={addDraft}>
            <PlusIcon data-icon="inline-start" />
            Add variant
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {product.variants.length === 0 && drafts.length === 0 ? (
          <EmptyState
            icon={BoxesIcon}
            title="No variants yet"
            description="A product needs at least one variant before it can be published."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Shade</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Price (Rs)</TableHead>
                <TableHead>Compare-at (Rs)</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants.map((variant) => (
                <VariantRow
                  key={variant.id}
                  productId={product.id}
                  basePrice={product.base_price}
                  variant={variant}
                  label={variant.sku}
                  sizes={sizes}
                  shades={shades}
                />
              ))}
              {drafts.map((draft) => (
                <VariantRow
                  key={`draft-${draft}`}
                  productId={product.id}
                  basePrice={product.base_price}
                  label={`new variant ${draft}`}
                  sizes={sizes}
                  shades={shades}
                  onDiscard={() => removeDraft(draft)}
                  onCreated={() => removeDraft(draft)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
