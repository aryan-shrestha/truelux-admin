import { readServerEnv } from "./env.ts";

describe("readServerEnv", () => {
  it("reads a valid API_URL", () => {
    expect(readServerEnv({ API_URL: "http://localhost:8000" })).toEqual({
      API_URL: "http://localhost:8000",
    });
  });

  it("names every missing or invalid variable in one error", () => {
    expect(() => readServerEnv({})).toThrow("Missing or invalid environment variables: API_URL");
    expect(() => readServerEnv({ API_URL: "ftp://api" })).toThrow("API_URL");
  });
});
