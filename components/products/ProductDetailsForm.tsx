"use client";

import { FormProvider } from "react-hook-form";
import { toast } from "sonner";

import { FormRootError } from "@/components/form/FormRootError";
import { MultiSelectField } from "@/components/form/MultiSelectField";
import { NumberField } from "@/components/form/NumberField";
import { type SelectOption, SelectField } from "@/components/form/SelectField";
import { SwitchField } from "@/components/form/SwitchField";
import { TextareaField } from "@/components/form/TextareaField";
import { TextField } from "@/components/form/TextField";
import { useActionForm } from "@/components/form/use-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { Product } from "@/lib/api/types";
import { createProductAction, updateProductAction } from "@/lib/products/actions";
import { productSchema } from "@/lib/products/schemas";

type ProductDetailsFormProps = {
  product?: Product;
  brands: SelectOption[];
  categories: SelectOption[];
  skinTypes: SelectOption[];
};

export function ProductDetailsForm({
  product,
  brands,
  categories,
  skinTypes,
}: ProductDetailsFormProps) {
  const { form, submit, isPending, rootError } = useActionForm({
    schema: productSchema,
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      brand_id: product?.brand.id ?? "",
      category_id: product?.category.id ?? "",
      base_price: product?.base_price ?? "",
      is_published: product?.is_published ?? false,
      sort_order: product?.sort_order ?? 0,
      skin_type_ids: product?.skin_types.map((skinType) => skinType.id) ?? [],
      skin_feel: product?.skin_feel ?? "",
      key_ingredients: product?.key_ingredients ?? "",
    },
    action: (values) =>
      product ? updateProductAction(product.id, values) : createProductAction(values),
    onSuccess: (saved) => {
      toast.success(product ? "Product saved" : "Product created");
      form.reset({ ...form.getValues(), slug: saved.slug, is_published: saved.is_published });
    },
    fieldForCode: { product_has_no_variants: "is_published" },
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit}>
        <Card>
          <CardContent>
            <FieldGroup>
              <FormRootError message={rootError} />
              <div className="grid gap-6 md:grid-cols-2">
                <TextField name="name" label="Name" autoComplete="off" />
                <TextField
                  name="slug"
                  label="Slug"
                  description="Leave blank to derive it from the name."
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <TextareaField name="description" label="Description" />
              <div className="grid gap-6 md:grid-cols-2">
                <SelectField
                  name="brand_id"
                  label="Brand"
                  placeholder="Choose a brand"
                  options={brands}
                />
                <SelectField
                  name="category_id"
                  label="Category"
                  placeholder="Choose a category"
                  options={categories}
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <TextField
                  name="base_price"
                  label="Base price"
                  prefix="Rs"
                  inputMode="decimal"
                  autoComplete="off"
                  description="Variants use this unless they set their own price."
                />
                <NumberField
                  name="sort_order"
                  label="Sort order"
                  description="Lower numbers come first."
                />
              </div>
              <MultiSelectField
                name="skin_type_ids"
                label="Skin types"
                placeholder="Choose skin types"
                options={skinTypes}
                description="Shown as “Suited to” and used by the storefront’s skin type filter."
              />
              <TextField
                name="skin_feel"
                label="Skin feel"
                placeholder="Soothed, balanced, refreshed"
                autoComplete="off"
              />
              <TextareaField name="key_ingredients" label="Key ingredients" />
              <SwitchField
                name="is_published"
                label="Published"
                description="Visible on the storefront. Needs at least one variant."
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              {product ? "Save details" : "Create product"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
