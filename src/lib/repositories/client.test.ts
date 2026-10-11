import { http, HttpResponse } from "msw";

import { server } from "@/test/msw-server";

import { httpClient } from "./client";
import { ApiError } from "./errors";

describe("httpClient", () => {
  it("sends requests to the BFF and rejects failures as ApiError", async () => {
    server.use(
      http.get("*/bff/api/admin/orders/", () =>
        HttpResponse.json(
          {
            error: {
              code: "authentication_failed",
              message: "Authentication credentials were not provided.",
              details: {},
            },
          },
          { status: 401 },
        ),
      ),
    );

    const request = httpClient.get("admin/orders/");

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 401, code: "authentication_failed" });
  });
});
