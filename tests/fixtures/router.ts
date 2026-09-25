import { vi } from "vitest";

export const router = {
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(),
  pathname: "/products",
};

export const navigationModule = {
  useRouter: () => router,
  usePathname: () => router.pathname,
  useSearchParams: () => router.searchParams,
};
