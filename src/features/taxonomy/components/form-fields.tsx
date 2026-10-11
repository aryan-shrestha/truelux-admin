import { TextField } from "@/components/form/text-field";

export function NameSlugFields({ namePlaceholder }: { namePlaceholder: string }) {
  return (
    <>
      <TextField name="name" label="Name" placeholder={namePlaceholder} />
      <TextField
        name="slug"
        label="Slug"
        description="Used in storefront URLs. Leave empty to make one from the name."
      />
    </>
  );
}

export function SortOrderField() {
  return (
    <TextField
      name="sort_order"
      label="Sort order"
      description="Lower numbers come first."
      inputMode="numeric"
    />
  );
}
