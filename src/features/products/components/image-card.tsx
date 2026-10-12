import { ArrowLeftIcon, ArrowRightIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError } from "@/lib/repositories/errors";

import {
  useDeleteImage,
  useMakeImagePrimary,
  useMoveImage,
  useUpdateImageAlt,
} from "../queries/products.mutations";
import type { ProductImage } from "../schemas/product.schema";

export function ImageCard({
  productId,
  images,
  index,
}: {
  productId: string;
  images: readonly ProductImage[];
  index: number;
}) {
  const image = images[index];
  const [altText, setAltText] = useState(image?.alt_text ?? "");
  const [isDeleting, setIsDeleting] = useState(false);
  const updateAlt = useUpdateImageAlt(productId);
  const move = useMoveImage(productId);
  const makePrimary = useMakeImagePrimary(productId);
  const remove = useDeleteImage(productId);
  if (image === undefined) return null;
  const position = index + 1;
  const label = `image ${position}`;

  function moveTo(to: number) {
    move.mutate(
      { images, from: index, to },
      { onError: (error) => toast.error(describeError(error)) },
    );
  }

  function saveAltText() {
    if (image === undefined) return;
    updateAlt.mutate(
      { id: image.id, altText: altText.trim() },
      {
        onSuccess: () => toast.success("Alt text saved"),
        onError: (error) => toast.error(describeError(error)),
      },
    );
  }

  function handleDelete() {
    if (image === undefined) return;
    remove.mutate(image.id, {
      onSuccess: () => {
        toast.success("Image deleted");
        setIsDeleting(false);
      },
      onError: (error) => {
        toast.error(describeError(error));
        setIsDeleting(false);
      },
    });
  }

  return (
    <Card size="sm" className="overflow-hidden pt-0">
      <div className="relative aspect-square bg-muted">
        <img src={image.url} alt={image.alt_text} className="size-full object-cover" />
        {image.is_primary && (
          <Badge className="absolute top-2 left-2" variant="info">
            Primary
          </Badge>
        )}
      </div>
      <CardContent>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            saveAltText();
          }}
        >
          <Input
            aria-label={`Alt text of ${label}`}
            placeholder="Describe the image"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            maxLength={255}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={altText.trim() === image.alt_text || updateAlt.isPending}
          >
            Save
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-1 border-t">
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Move ${label} earlier`}
            disabled={index === 0 || move.isPending}
            onClick={() => moveTo(index - 1)}
          >
            <ArrowLeftIcon />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Move ${label} later`}
            disabled={index === images.length - 1 || move.isPending}
            onClick={() => moveTo(index + 1)}
          >
            <ArrowRightIcon />
          </Button>
        </div>
        <div className="flex gap-1">
          {!image.is_primary && (
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Make ${label} primary`}
              disabled={makePrimary.isPending}
              onClick={() =>
                makePrimary.mutate(image.id, {
                  onSuccess: () => toast.success("Primary image changed"),
                  onError: (error) => toast.error(describeError(error)),
                })
              }
            >
              <StarIcon data-icon="inline-start" />
              Primary
            </Button>
          )}
          <ConfirmDialog
            trigger={
              <Button size="icon" variant="ghost" aria-label={`Delete ${label}`}>
                <Trash2Icon />
              </Button>
            }
            title={`Delete ${label}?`}
            description="This cannot be undone."
            confirmLabel="Delete"
            isPending={remove.isPending}
            open={isDeleting}
            onOpenChange={setIsDeleting}
            onConfirm={handleDelete}
          />
        </div>
      </CardFooter>
    </Card>
  );
}

export function ImageCardSkeleton({ fileName }: { fileName: string }) {
  return (
    <Card
      size="sm"
      role="status"
      aria-label={`Uploading ${fileName}`}
      className="overflow-hidden pt-0"
    >
      <Skeleton className="aspect-square rounded-none" />
      <CardContent>
        <Skeleton className="h-8 w-full" />
      </CardContent>
      <CardFooter className="border-t">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );
}
