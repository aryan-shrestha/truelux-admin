import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Globals are off, so Testing Library cannot register its own cleanup. Without it a
// Radix overlay's `pointer-events: none` on <body> leaks into the next test.
afterEach(cleanup);

// No test reaches the network: a test that needs a response stubs fetch itself, and
// vi.unstubAllGlobals() puts this guard back.
globalThis.fetch = async (input) => {
  const url = input instanceof Request ? input.url : String(input);
  throw new Error(`Unstubbed fetch to ${url}; stub fetch in this test.`);
};

// jsdom implements neither; Radix Select and cmdk call them. lib/api suites run in the
// node environment, which has no DOM to patch.
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false;
  };
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
