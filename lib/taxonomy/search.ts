export function matchingName<T extends { name: string; slug: string }>(items: T[], query: string): T[] {
  const needle = query.toLowerCase();
  if (!needle) {
    return items;
  }
  return items.filter(
    (item) => item.name.toLowerCase().includes(needle) || item.slug.includes(needle),
  );
}
