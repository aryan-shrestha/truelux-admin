import { ImagesIcon, UploadIcon } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { IMAGE_ACCEPT, IMAGE_FILE_SCHEMA } from "@/lib/image-upload";
import { describeError } from "@/lib/repositories/errors";

import { useUploadImages } from "../queries/products.mutations";
import type { Product } from "../schemas/product.schema";
import { ImageCard, ImageCardSkeleton } from "./image-card";

export function ImagesManager({ product }: { product: Product }) {
  const upload = useUploadImages(product.id);
  const [uploadError, setUploadError] = useState<string>();
  const uploadingFiles = upload.isPending ? upload.variables.files : [];

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    // The same file can be chosen again after a failure.
    event.target.value = "";
    const accepted: File[] = [];
    for (const file of files) {
      const result = IMAGE_FILE_SCHEMA.safeParse(file);
      if (result.success) accepted.push(file);
      else toast.error(`${file.name}: ${result.error.issues[0]?.message}`);
    }
    if (accepted.length === 0) return;
    setUploadError(undefined);
    upload.mutate(
      { files: accepted, hasPrimary: product.images.some((image) => image.is_primary) },
      {
        onSuccess: () =>
          toast.success(
            accepted.length === 1 ? "Image uploaded" : `${accepted.length} images uploaded`,
          ),
        onError: (error) => setUploadError(describeError(error)),
      },
    );
  }

  return (
    // Card drops its bottom padding when it contains a footer, and `:has` also matches
    // the image cards' footers, so the padding is restored here.
    <Card className="has-data-[slot=card-footer]:pb-(--card-spacing) md:min-h-0">
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>
          JPEG, PNG or WebP, up to 5 MB each. The primary image leads on the storefront and in the
          product list.
        </CardDescription>
        <CardAction>
          <Button asChild variant="outline" disabled={upload.isPending}>
            <label>
              {upload.isPending ? (
                <Spinner aria-hidden data-icon="inline-start" />
              ) : (
                <UploadIcon data-icon="inline-start" />
              )}
              Upload images
              <input
                type="file"
                multiple
                accept={IMAGE_ACCEPT}
                className="sr-only"
                disabled={upload.isPending}
                onChange={handleFiles}
              />
            </label>
          </Button>
        </CardAction>
      </CardHeader>
      {/* The grid scrolls; Upload images stays in view. */}
      <CardContent className="relative flex flex-col gap-4 md:min-h-0 md:overflow-y-auto">
        {uploadError && (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        {product.images.length === 0 && uploadingFiles.length === 0 ? (
          <EmptyState
            icon={ImagesIcon}
            title="No images yet"
            description="The first image uploaded becomes the primary one."
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-6">
            {product.images.map((image, index) => (
              <ImageCard
                key={image.id}
                productId={product.id}
                images={product.images}
                index={index}
              />
            ))}
            {uploadingFiles.map((file, index) => (
              <ImageCardSkeleton key={`${index}-${file.name}`} fileName={file.name} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
