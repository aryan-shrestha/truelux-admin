import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { describeError } from "@/lib/repositories/errors";

import { useSetPublished } from "../queries/products.mutations";
import type { Product } from "../schemas/product.schema";

export function PublishButton({ product }: { product: Product }) {
  const setPublished = useSetPublished();
  const isPublishing = !product.is_published;

  function handleClick() {
    setPublished.mutate(
      { id: product.id, isPublished: isPublishing },
      {
        onSuccess: () =>
          toast.success(`${product.name} ${isPublishing ? "published" : "unpublished"}`),
        onError: (error) => toast.error(describeError(error)),
      },
    );
  }

  return (
    <Button
      variant={isPublishing ? "default" : "outline"}
      disabled={setPublished.isPending}
      onClick={handleClick}
    >
      {setPublished.isPending ? (
        <Spinner aria-hidden data-icon="inline-start" />
      ) : isPublishing ? (
        <EyeIcon data-icon="inline-start" />
      ) : (
        <EyeOffIcon data-icon="inline-start" />
      )}
      {isPublishing ? "Publish" : "Unpublish"}
    </Button>
  );
}
