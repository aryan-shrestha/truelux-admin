"use client";

import { TextField } from "@/components/form/TextField";

export function NameSlugFields({ namePlaceholder }: { namePlaceholder: string }) {
  return (
    <>
      <TextField name="name" label="Name" placeholder={namePlaceholder} autoComplete="off" />
      <TextField
        name="slug"
        label="Slug"
        description="Used in storefront URLs. Leave blank to derive it from the name."
        autoComplete="off"
        spellCheck={false}
      />
    </>
  );
}
