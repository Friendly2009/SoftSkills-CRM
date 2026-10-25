import "dotenv/config";
export function configuration() {
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32 || secret.startsWith("replace-"))
    throw new Error("Set a random SESSION_SECRET (32+ characters)");
  const production = process.env.NODE_ENV === "production";
  const secure = process.env.COOKIE_SECURE === "true";
  const origin = process.env.APP_ORIGIN ?? "http://localhost:5173";
  if (production && (!secure || !origin.startsWith("https://")))
    throw new Error(
      "Production requires HTTPS APP_ORIGIN and COOKIE_SECURE=true",
    );
  return {
    secret,
    secure,
    origin,
    production,
    trustProxy: process.env.TRUST_PROXY === "1",
  };
}
