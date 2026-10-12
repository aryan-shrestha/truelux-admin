import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { showApiError } from "@/components/form/show-api-error";
import { SwitchField } from "@/components/form/switch-field";
import { TextField } from "@/components/form/text-field";
import { TextareaField } from "@/components/form/textarea-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { taxonomyQueries, type Category } from "@/features/taxonomy";

import { toProductBody } from "../product-body";
import { useSaveProduct } from "../queries/products.mutations";
import { PRODUCT_FORM_SCHEMA, type ProductFormValues } from "../schemas/product-form.schema";
import type { Product } from "../schemas/product.schema";
import { MultiSelectField } from "./multi-select-field";
import { ComboboxField } from "./combobox-field";

// A child category is shown with its parent ("Lips › Gloss"), alphabetically.
function categoryOptions(categories: readonly Category[]) {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  return categories
    .map((category) => {
      const parentName = category.parent_id === null ? undefined : names.get(category.parent_id);
      return {
        value: category.id,
        label: parentName === undefined ? category.name : `${parentName} › ${category.name}`,
      };
    })
    .toSorted((a, b) => a.label.localeCompare(b.label));
}

function toFormValues(product: Product | undefined): ProductFormValues {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    brand_id: product?.brand.id ?? "",
    category_id: product?.category.id ?? "",
    base_price: product?.base_price ?? "",
    sort_order: product?.sort_order ?? 0,
    skin_type_ids: product?.skin_types.map((skinType) => skinType.id) ?? [],
    skin_feel: product?.skin_feel ?? "",
    key_ingredients: product?.key_ingredients ?? "",
    is_published: product?.is_published ?? false,
  };
}

export function ProductForm({
  product,
  onCreated,
}: {
  product?: Product;
  onCreated?: (product: Product) => void;
}) {
  const save = useSaveProduct(product?.id ?? null);
  const { data: brands = [] } = useQuery(taxonomyQueries.list("brands"));
  const { data: categories = [] } = useQuery(taxonomyQueries.list("categories"));
  const { data: skinTypes = [] } = useQuery(taxonomyQueries.list("skin-types"));
  const form = useForm<z.input<typeof PRODUCT_FORM_SCHEMA>, unknown, ProductFormValues>({
    resolver: zodResolver(PRODUCT_FORM_SCHEMA),
    defaultValues: toFormValues(product),
  });
  const rootError = form.formState.errors.root?.message;

  function handleSubmit(values: ProductFormValues) {
    save.mutate(toProductBody(values), {
      onSuccess: (saved) => {
        if (product === undefined) {
          toast.success("Product created");
          onCreated?.(saved);
          return;
        }
        toast.success("Product saved");
        form.reset(toFormValues(saved));
      },
      onError: (error) => {
        // Publishing needs a variant first; the API says so on the Published switch.
        if (error.code === "product_has_no_variants") {
          form.setError("is_published", {
            message: "Add at least one variant before publishing.",
          });
          return;
        }
        showApiError(form, error, {
          conflict: "This duplicates an existing product. Check the name and the slug.",
        });
      },
    });
  }

  return (
    <FormProvider {...form}>
      {/* The fields scroll between the card's top and its Save footer. */}
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col md:min-h-0"
      >
        <Card className="md:min-h-0">
          <CardContent className="relative md:min-h-0 md:overflow-y-auto">
            <FieldGroup>
              {rootError && (
                <Alert variant="destructive" aria-live="polite">
                  <AlertDescription>{rootError}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <TextField name="name" label="Name" />
                <TextField
                  name="slug"
                  label="Slug"
                  description="Leave empty to make one from the name."
                />
                <ComboboxField
                  name="brand_id"
                  label="Brand"
                  placeholder="Search brands"
                  emptyMessage="No brand matches."
                  options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
                />
                <ComboboxField
                  name="category_id"
                  label="Category"
                  placeholder="Search categories"
                  emptyMessage="No category matches."
                  options={categoryOptions(categories)}
                />
                <TextField
                  name="base_price"
                  label="Base price"
                  prefix="Rs"
                  inputMode="decimal"
                  description="Variants use this unless they set their own price."
                />
                <TextField
                  name="sort_order"
                  label="Sort order"
                  inputMode="numeric"
                  description="Lower numbers come first."
                />
              </div>
              <TextareaField name="description" label="Description" rows={5} />
              <MultiSelectField
                name="skin_type_ids"
                label="Skin types"
                placeholder="Choose skin types"
                options={skinTypes.map((skinType) => ({
                  value: skinType.id,
                  label: skinType.name,
                }))}
              />
              <div className="grid gap-6 md:grid-cols-2">
                <TextField name="skin_feel" label="Skin feel" description="Up to 200 characters." />
                <TextareaField name="key_ingredients" label="Key ingredients" />
              </div>
              <SwitchField
                name="is_published"
                label="Published"
                description="Shown on the storefront. Needs at least one variant."
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Spinner aria-hidden data-icon="inline-start" />}
              {product === undefined ? "Create product" : "Save product"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
