import { z } from "zod";
export const id = z.string().uuid();
export const text = z.string().trim().min(1).max(255);
export const note = z.string().trim().max(4000).default("");
export const money = z
  .string()
  .regex(/^(0|[1-9]\d{0,11})$/, "Use integer kopecks as a decimal string");
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Invalid calendar date",
  );
export const instant = z
  .string()
  .datetime({ offset: true })
  .transform((v) => new Date(v).toISOString());
export const role = z.enum([
  "director",
  "manager",
  "teacher",
  "payer",
  "student",
]);
export const roles = z
  .array(role)
  .min(1)
  .max(5)
  .refine((v) => new Set(v).size === v.length);
export const password = z.string().min(12).max(128);
export const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
export function normalizePhone(raw: string) {
  const value = raw.replace(/[\s()\-]/g, "");
  if (/^8\d{10}$/.test(value)) return "+7" + value.slice(1);
  if (/^7\d{10}$/.test(value)) return "+" + value;
  if (/^\+[1-9]\d{7,14}$/.test(value)) return value;
  throw new Error("Phone must be E.164 or Russian 8/7 + 10 digits");
}
export const phone = z
  .string()
  .max(40)
  .transform((v, ctx) => {
    try {
      return normalizePhone(v);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid phone" });
      return z.NEVER;
    }
  });
export const contacts = z
  .array(
    z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("email"), value: email }).strict(),
      z.object({ kind: z.literal("phone"), value: phone }).strict(),
    ]),
  )
  .max(10)
  .refine(
    (v) => new Set(v.map((c) => c.kind + ":" + c.value)).size === v.length,
    "Duplicate normalized contacts",
  )
  .default([]);
export const pageQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    q: z.string().max(100).optional(),
    sortBy: z
      .enum([
        "id",
        "name",
        "status",
        "date",
        "capacity",
        "version",
        "created_at",
        "starts_at",
        "ends_at",
        "priority",
      ])
      .default("id"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    archived: z.enum(["exclude", "only", "all"]).default("exclude"),
    personId: id.optional(),
    payerId: id.optional(),
    studentId: id.optional(),
    groupId: id.optional(),
    responsibleId: id.optional(),
    teacherId: id.optional(),
    roomId: id.optional(),
    priority: z.enum(["Обычный", "Высокий", "Низкий"]).optional(),
    branchId: id.optional(),
    status: z.string().max(60).optional(),
    from: instant.optional(),
    to: instant.optional(),
  })
  .strict();
export function amount(price: string, discount: string) {
  const n = BigInt(price) - BigInt(discount);
  if (n < 0n) throw new Error("Discount exceeds price");
  return n.toString();
}
export function json(value: any) {
  return typeof value === "string" ? JSON.parse(value) : value;
}
export function sqlTime(v: string) {
  return new Date(v).toISOString().slice(0, 23).replace("T", " ");
}
export function isoTime(v: string) {
  return v.includes("T") ? v : v.replace(" ", "T") + "Z";
}
