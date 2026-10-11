import type { ProductImage } from "./schemas/product.schema";

// Stored orders can collide (several 0s: an upload starts at 0), so swapping two values
// could change nothing. A move renumbers every image from its new position and reports
// only the images whose number changed.
export function moveImage(images: readonly ProductImage[], from: number, to: number) {
  const reordered = [...images];
  const [moved] = reordered.splice(from, 1);
  if (moved === undefined) return { images: [...images], changes: [] };
  reordered.splice(to, 0, moved);
  const renumbered = reordered.map((image, index) => ({ ...image, sort_order: index }));
  const changes = renumbered
    .filter(
      (image) =>
        images.find((original) => original.id === image.id)?.sort_order !== image.sort_order,
    )
    .map((image) => ({ id: image.id, sort_order: image.sort_order }));
  return { images: renumbered, changes };
}
