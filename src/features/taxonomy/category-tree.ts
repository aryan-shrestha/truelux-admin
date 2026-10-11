import type { Category } from "./schemas/taxonomy.schema";

export type CategoryRow = Category & { depth: 0 | 1; parentName: string | null };

function bySortOrder(a: Category, b: Category): number {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
}

// Each top-level category, then its children. A child whose parent is not in the list
// (filtered out by a search) shows as top level.
export function toCategoryRows(categories: readonly Category[]): CategoryRow[] {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const children = new Map<string, Category[]>();
  const roots: Category[] = [];
  for (const category of categories) {
    if (category.parent_id !== null && names.has(category.parent_id)) {
      children.set(category.parent_id, [...(children.get(category.parent_id) ?? []), category]);
    } else {
      roots.push(category);
    }
  }
  return roots.toSorted(bySortOrder).flatMap((root) => [
    { ...root, depth: 0 as const, parentName: null },
    ...(children.get(root.id) ?? []).toSorted(bySortOrder).map((child) => ({
      ...child,
      depth: 1 as const,
      parentName: root.name,
    })),
  ]);
}
