import { http, HttpResponse } from "msw";

export const STAFF_USER = {
  id: "0b9a4a3e-4d1e-4c55-9a43-1d3c2b1f6f01",
  email: "asha@truelux.test",
  first_name: "Asha",
  last_name: "Rai",
};

export const meHandler = http.get("*/api/v1/auth/me/", () => HttpResponse.json(STAFF_USER));
