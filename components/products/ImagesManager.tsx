"use client";

import { useMutation } from "@tanstack/react-query";
import { ImagesIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { ImageCard } from "@/components/products/ImageCard";
import { useImageMutation } from "@/components/products/use-image-mutation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { ProductImage } from "@/lib/api/types";
import { reorderImages, uploadImage } from "@/lib/products/actions";
import { productInvalidates } from "@/lib/products/queries";
import { IMAGE_TYPES, imageUploadSchema } from "@/lib/products/schemas";

export function orderAfterMove(
  images: ProductImage[],
  index: number,
  direction: -1 | 1,
): { id: string; sort_order: number }[] {
  const order = images.map((image) => image.id);
  const target = index + direction;
  const moved = order[index];
  const displaced = order[target];
  if (moved === undefined || displaced === undefined) return [];
  order[index] = displaced;
  order[target] = moved;
  return order.flatMap((id, position) =>
    images.find((image) => image.id === id)?.sort_order === position
      ? []
      : [{ id, sort_order: position }],
  );
}

type ImagesManagerProps = {
  productId: string;
  images: ProductImage[];
};

type ImageOrder = { id: string; sort_order: number }[];

function withOrder(images: ProductImage[], order: ImageOrder): ProductImage[] {
  return images.map((image) => {
    const moved = order.find((entry) => entry.id === image.id);
    return moved ? { ...image, sort_order: moved.sort_order } : image;
  });
}

export function ImagesManager({ productId, images }: ImagesManagerProps) {
  const sorted = images.toSorted((a, b) => a.sort_order - b.sort_order);

  // Files go up one at a time, each with its own toast; a file that fails does not stop
  // the rest.
  const { mutate: upload, isPending: isUploading } = useMutation({
    mutationFn: async (files: File[]) => {
      let hasPrimary = images.some((image) => image.is_primary);
      for (const file of files) {
        const values = { file, alt_text: "", is_primary: !hasPrimary };
        const checked = imageUploadSchema.safeParse(values);
        if (!checked.success) {
          toast.error(
            `${file.name}: ${checked.error.issues[0]?.message ?? "not an allowed image."}`,
          );
          continue;
        }
        const result = await uploadImage(productId, values);
        if (result.ok) {
          hasPrimary = true;
          toast.success(`${file.name} uploaded`);
        } else {
          toast.error(`${file.name}: ${result.message}`);
        }
      }
    },
    meta: { invalidates: productInvalidates(productId) },
  });

  const { mutate: reorder, isPending: isMoving } = useImageMutation({
    productId,
    action: reorderImages,
    optimistic: withOrder,
  });

  function move(index: number, direction: -1 | 1) {
    reorder(orderAfterMove(sorted, index, direction));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>
          The primary image leads the product page and the listings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Field>
          <FieldLabel htmlFor="image-upload">
            {isUploading ? <Spinner /> : <UploadIcon />}
            Upload images
          </FieldLabel>
          <Input
            id="image-upload"
            type="file"
            multiple
            accept={IMAGE_TYPES.join(",")}
            disabled={isUploading}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length > 0) upload(files);
            }}
          />
          <FieldDescription>JPEG, PNG or WebP, up to 5 MB each.</FieldDescription>
        </Field>
        {sorted.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ImagesIcon />
              </EmptyMedia>
              <EmptyTitle>No images</EmptyTitle>
              <EmptyDescription>
                The first image you upload becomes the primary one.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((image, index) => (
              <li key={image.id}>
                <ImageCard
                  productId={productId}
                  image={image}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === sorted.length - 1}
                  isMoving={isMoving}
                  onMove={(direction) => move(index, direction)}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
