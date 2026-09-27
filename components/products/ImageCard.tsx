"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, StarIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/form/ConfirmAction";
import { useImageMutation } from "@/components/products/use-image-mutation";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { ProductImage } from "@/lib/api/types";
import { removeImage, updateImage } from "@/lib/products/actions";
import { productInvalidates } from "@/lib/products/queries";
import { failureMessage, throwOnFailure } from "@/lib/query/action";

type ImageCardProps = {
  productId: string;
  image: ProductImage;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  isMoving: boolean;
};

export function ImageCard({
  productId,
  image,
  position,
  isFirst,
  isLast,
  onMove,
  isMoving,
}: ImageCardProps) {
  const [altText, setAltText] = useState(image.alt_text);
  const altId = `alt-${image.id}`;

  const saveAlt = useImageMutation({
    productId,
    action: (alt_text: string) => updateImage(image.id, { alt_text }),
    optimistic: (images, alt_text) =>
      images.map((candidate) =>
        candidate.id === image.id ? { ...candidate, alt_text } : candidate,
      ),
    successMessage: "Alt text saved",
  });

  // The API clears the old primary itself, so this waits for its answer.
  const makePrimary = useMutation({
    mutationFn: async () => throwOnFailure(await updateImage(image.id, { is_primary: true })),
    meta: { invalidates: productInvalidates(productId) },
    onSuccess: () => toast.success("Primary image set"),
    onError: (error) => {
      const message = failureMessage(error);
      if (message) toast.error(message);
    },
  });

  const isSaving = saveAlt.isPending || makePrimary.isPending;

  return (
    <Card size="sm" className="pt-0">
      <AspectRatio ratio={1} className="bg-muted">
        <Image
          src={image.url}
          alt={image.alt_text}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover"
        />
        {image.is_primary ? <Badge className="absolute top-2 left-2">Primary</Badge> : null}
      </AspectRatio>
      <CardContent>
        <Field>
          <FieldLabel htmlFor={altId}>Alt text</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={altId}
              value={altText}
              maxLength={255}
              placeholder="Describe the photo"
              onChange={(event) => setAltText(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="xs"
                disabled={isSaving || altText.trim() === image.alt_text}
                onClick={() => saveAlt.mutate(altText.trim())}
              >
                Save
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </CardContent>
      <CardFooter className="justify-between gap-1 border-t">
        <div className="flex gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Move image ${position} earlier`}
            disabled={isFirst || isMoving}
            onClick={() => onMove(-1)}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Move image ${position} later`}
            disabled={isLast || isMoving}
            onClick={() => onMove(1)}
          >
            <ArrowDownIcon />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={image.is_primary || isSaving}
            onClick={() => makePrimary.mutate()}
          >
            <StarIcon data-icon="inline-start" />
            Make primary
          </Button>
          <ConfirmAction
            trigger={
              <Button size="icon-sm" variant="ghost" aria-label={`Delete image ${position}`}>
                <Trash2Icon />
              </Button>
            }
            title="Delete this image?"
            description="It is removed from the product. This cannot be undone."
            confirmLabel="Delete image"
            successMessage="Image deleted"
            action={() => removeImage(image.id)}
            invalidates={productInvalidates(productId)}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
