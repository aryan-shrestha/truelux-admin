import type { Category } from "@/lib/api/types";

export type CategoryRow = Category & { depth: 0 | 1; parentName: string | null };

function byOrder(a: Category, b: Category): number {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
}

export function toCategoryRows(categories: Category[]): CategoryRow[] {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const children = new Map<string, Category[]>();
  const roots: Category[] = [];
  for (const category of categories) {
    if (category.parent_id && names.has(category.parent_id)) {
      children.set(category.parent_id, [...(children.get(category.parent_id) ?? []), category]);
    } else {
      roots.push(category);
    }
  }
  return roots.toSorted(byOrder).flatMap((root) => [
    { ...root, depth: 0 as const, parentName: null },
    ...(children.get(root.id) ?? []).toSorted(byOrder).map((child) => ({
      ...child,
      depth: 1 as const,
      parentName: root.name,
    })),
  ]);
}
