import { afterEach } from "vitest";
import { act, cleanup } from "@testing-library/react";

// Vitest globals are disabled, so Testing Library cannot register auto-cleanup.
// Unmount and flush React work before jsdom is torn down.
afterEach(async () => {
  if (typeof document !== "undefined") await act(async () => { cleanup(); });
});
