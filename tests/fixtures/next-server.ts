import { vi } from "vitest";

type SetCall = { name: string; value: string; options: Record<string, unknown> | undefined };

export const cookieJar = {
  values: new Map<string, string>(),
  sets: [] as SetCall[],
  reset(initial: Record<string, string> = {}) {
    this.values = new Map(Object.entries(initial));
    this.sets = [];
  },
};

export const headersModule = {
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.values.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      cookieJar.values.set(name, value);
      cookieJar.sets.push({ name, value, options });
    },
    delete: (name: string) => {
      cookieJar.values.delete(name);
    },
  }),
};

export class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`redirect ${url}`);
  }
}

export const navigationModule = {
  redirect: vi.fn((url: string) => {
    throw new RedirectSignal(url);
  }),
  unstable_rethrow: (error: unknown) => {
    if (error instanceof RedirectSignal) {
      throw error;
    }
  },
};
