import axios from "axios";

import { toApiError } from "./errors";

// Every call goes to the BFF on this origin, which adds the staff JWT and forwards to
// /api/v1/ on the Django API (ADR 0001). Paths are relative: "admin/products/".
export const httpClient = axios.create({
  baseURL: "/bff/api/",
  headers: { Accept: "application/json" },
});

httpClient.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(toApiError(error)),
);
