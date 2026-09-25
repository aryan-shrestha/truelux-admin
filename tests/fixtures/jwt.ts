export function fakeJwt(expiresInSeconds: number, now: number = Date.now()): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(now / 1000) + expiresInSeconds }),
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}
