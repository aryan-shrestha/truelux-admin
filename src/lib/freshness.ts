// How often something outside the admin changes the data decides how soon it is
// refetched. The admin's own changes invalidate at once through `meta.invalidates`.
export const FRESHNESS = {
  // New orders and other staff: stale after 30 s, polled every minute while shown.
  live: { staleTime: 30_000, refetchInterval: 60_000 },
  // Stock moves with storefront orders: stale after 30 s, refetched when shown again.
  volatile: { staleTime: 30_000 },
  // Changed only by other staff.
  reference: { staleTime: 10 * 60_000 },
} as const;
