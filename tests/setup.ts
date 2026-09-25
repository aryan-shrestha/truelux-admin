import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Globals are off, so Testing Library cannot register its own cleanup. Without it a
// Radix overlay's `pointer-events: none` on <body> leaks into the next test.
afterEach(cleanup);

// jsdom implements neither; Radix Select and cmdk call them.
Element.prototype.scrollIntoView = function scrollIntoView() {};
Element.prototype.hasPointerCapture = function hasPointerCapture() {
  return false;
};
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
