import { readEnv } from "./env";

describe("readEnv", () => {
  it("accepts an http(s) API URL and drops a trailing slash", () => {
    const env = readEnv({ VITE_API_URL: "https://api.truelux.test/" });

    expect(env.VITE_API_URL).toBe("https://api.truelux.test");
  });

  it("names a missing or non-http VITE_API_URL", () => {
    expect(() => readEnv({})).toThrow("VITE_API_URL");
    expect(() => readEnv({ VITE_API_URL: "ftp://api.truelux.test" })).toThrow("VITE_API_URL");
  });
});
