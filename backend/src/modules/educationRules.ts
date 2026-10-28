import { z } from "zod";
import { assert } from "../core/errors.js";
export const timeZone = z
  .string()
  .min(1)
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return !/^[+-]/.test(value);
    } catch {
      return false;
    }
  }, "Use a valid IANA time zone");
/** Integer kopecks. Percent is basis points (10000 = 100%). Round final payable half up. */
export function lessonDiscount(
  price: string,
  fixed?: string,
  basisPoints?: number,
): string {
  assert(
    fixed === undefined || basisPoints === undefined,
    400,
    "INVALID_DISCOUNT",
    "Choose fixed OR percentage discount",
  );
  const p = BigInt(price);
  assert(p >= 0n, 400, "INVALID_PRICE", "Negative price");
  if (basisPoints !== undefined) {
    assert(
      Number.isInteger(basisPoints) && basisPoints >= 0 && basisPoints <= 10000,
      400,
      "INVALID_DISCOUNT",
      "Percentage must be 0..10000 basis points",
    );
    const payable = (p * BigInt(10000 - basisPoints) + 5000n) / 10000n;
    return (p - payable).toString();
  }
  const d = BigInt(fixed ?? "0");
  assert(d >= 0n && d <= p, 400, "INVALID_DISCOUNT", "Discount exceeds price");
  return d.toString();
}
