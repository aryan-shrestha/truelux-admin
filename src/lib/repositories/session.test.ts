import { clearSession, hasSession, readSession, saveSession } from "./session";

afterEach(() => localStorage.clear());

describe("session", () => {
  it("reads back the saved token pair", () => {
    saveSession({ access: "a1", refresh: "r1" });

    expect(readSession()).toEqual({ access: "a1", refresh: "r1" });
    expect(hasSession()).toBe(true);
  });

  it("treats a corrupt or incomplete value as no session", () => {
    localStorage.setItem("truelux-admin-session", "{not json");
    expect(readSession()).toBeNull();

    localStorage.setItem("truelux-admin-session", JSON.stringify({ access: "a1" }));
    expect(readSession()).toBeNull();
  });

  it("clears the session", () => {
    saveSession({ access: "a1", refresh: "r1" });

    clearSession();

    expect(hasSession()).toBe(false);
  });
});
