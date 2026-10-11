import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";

import { server } from "./msw-server";

// jsdom has no matchMedia; the sidebar's mobile check and the theme hooks call it.
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

// jsdom does not implement scrolling; the router's scroll restoration calls this.
window.scrollTo = () => {};

// jsdom has no pointer capture, scrollIntoView or ResizeObserver; Radix Dialog and
// Select use them.
Element.prototype.hasPointerCapture = () => false;
Element.prototype.releasePointerCapture = () => {};
Element.prototype.scrollIntoView = () => {};
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
