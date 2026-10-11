import { setupServer } from "msw/node";

// Tests register their own handlers with server.use(); there are no shared defaults.
export const server = setupServer();
