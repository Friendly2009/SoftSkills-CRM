import "dotenv/config";
import { z } from "zod";
const bool = z.enum(["true", "false"]);
export function configuration() {
  const e = z
    .object({
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
      HOST: z.string().min(1).default("127.0.0.1"),
      PORT: z.coerce.number().int().min(1).max(65535).default(3000),
      DB_HOST: z.string().min(1),
      DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
      DB_USER: z.string().min(1),
      DB_PASSWORD: z.string().min(1),
      DB_NAME: z.string().regex(/^[a-zA-Z0-9_]+$/),
      SESSION_SECRET: z
        .string()
        .min(32)
        .refine((v) => !v.startsWith("replace-")),
      APP_ORIGIN: z.string().url().default("http://localhost:5173"),
      CORS_ORIGINS: z.string().default(""),
      COOKIE_SECURE: bool.default("false"),
      COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
      TRUST_PROXY: z.enum(["0", "1"]).default("0"),
    })
    .safeParse(process.env);
  if (!e.success)
    throw new Error(
      "Invalid environment: " +
        e.error.issues.map((i) => i.path.join(".")).join(", "),
    );
  const v = e.data;
  const origins = [
    ...new Set([v.APP_ORIGIN, ...v.CORS_ORIGINS.split(",").filter(Boolean)]),
  ];
  for (const value of origins) {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== value)
      throw new Error("Origins must be exact http(s) origins without paths");
    if (v.NODE_ENV === "production" && url.protocol !== "https:")
      throw new Error("Production requires HTTPS origins");
  }
  if (
    (v.NODE_ENV === "production" || v.COOKIE_SAME_SITE === "none") &&
    v.COOKIE_SECURE !== "true"
  )
    throw new Error("Production and SameSite=None require COOKIE_SECURE=true");
  return {
    secret: v.SESSION_SECRET,
    secure: v.COOKIE_SECURE === "true",
    origin: v.APP_ORIGIN,
    origins,
    sameSite: v.COOKIE_SAME_SITE,
    production: v.NODE_ENV === "production",
    trustProxy: v.TRUST_PROXY === "1",
    host: v.HOST,
    port: v.PORT,
    db: {
      host: v.DB_HOST,
      port: v.DB_PORT,
      user: v.DB_USER,
      password: v.DB_PASSWORD,
      database: v.DB_NAME,
    },
  };
}
