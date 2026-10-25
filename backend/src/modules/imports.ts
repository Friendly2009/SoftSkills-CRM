import type { Express } from "express";
import ExcelJS from "exceljs";
import { inflateRawSync } from "node:zlib";
import { z } from "zod";
import { route } from "../core/api.js";
import { permit } from "../core/security.js";
import { id } from "../core/validation.js";
import { assert, AppError } from "../core/errors.js";
import {
  personSchema,
  createPerson,
  ensurePayer,
  ensureStudent,
} from "./people.js";
// Base64 JSON keeps one CSRF/error/size pipeline. Compressed size 512 KiB, decompressed XML 8 MiB.
export function inspectZip(buffer: Buffer) {
  let total = 0,
    count = 0;
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert(
    end >= 0 && end + 22 <= buffer.length,
    400,
    "INVALID_XLSX",
    "Invalid ZIP",
  );
  const files = buffer.readUInt16LE(end + 10),
    offset = buffer.readUInt32LE(end + 16);
  assert(files <= 1000, 400, "INVALID_XLSX", "Too many ZIP entries");
  let pos = offset;
  while (count < files) {
    assert(
      pos + 46 <= buffer.length && buffer.readUInt32LE(pos) === 0x02014b50,
      400,
      "INVALID_XLSX",
      "Invalid ZIP directory",
    );
    total += buffer.readUInt32LE(pos + 24);
    assert(
      total <= 8 * 1024 * 1024,
      413,
      "XLSX_TOO_LARGE",
      "Uncompressed workbook exceeds 8 MiB",
    );
    assert(
      !(buffer.readUInt16LE(pos + 8) & 1),
      400,
      "INVALID_XLSX",
      "Encrypted workbook unsupported",
    );
    const compressedSize = buffer.readUInt32LE(pos + 20),
      declaredSize = buffer.readUInt32LE(pos + 24),
      local = buffer.readUInt32LE(pos + 42),
      method = buffer.readUInt16LE(pos + 10);
    assert(
      local + 30 <= buffer.length && buffer.readUInt32LE(local) === 0x04034b50,
      400,
      "INVALID_XLSX",
      "Invalid ZIP local header",
    );
    const start =
      local +
      30 +
      buffer.readUInt16LE(local + 26) +
      buffer.readUInt16LE(local + 28);
    assert(
      start + compressedSize <= buffer.length && [0, 8].includes(method),
      400,
      "INVALID_XLSX",
      "Unsupported ZIP entry",
    );
    try {
      const data = buffer.subarray(start, start + compressedSize);
      const inflated =
        method === 8
          ? inflateRawSync(data, { maxOutputLength: 8 * 1024 * 1024 })
          : data;
      assert(
        inflated.length === declaredSize,
        400,
        "INVALID_XLSX",
        "ZIP size mismatch",
      );
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(
        413,
        "XLSX_TOO_LARGE",
        "Invalid or oversized compressed XML",
      );
    }
    const nameLength = buffer.readUInt16LE(pos + 28),
      extra = buffer.readUInt16LE(pos + 30),
      comment = buffer.readUInt16LE(pos + 32);
    pos += 46 + nameLength + extra + comment;
    count++;
    assert(pos <= buffer.length, 400, "INVALID_XLSX", "Invalid ZIP entry");
  }
}
export async function parseWorkbook(encoded: string) {
  const buffer = Buffer.from(encoded, "base64");
  assert(
    buffer.length <= 512 * 1024,
    413,
    "XLSX_TOO_LARGE",
    "Compressed workbook exceeds 512 KiB",
  );
  inspectZip(buffer);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch {
    throw new AppError(400, "INVALID_XLSX", "Cannot parse XLSX workbook");
  }
  assert(
    workbook.worksheets.length === 1,
    400,
    "INVALID_XLSX",
    "Exactly one sheet required",
  );
  const sheet = workbook.worksheets[0]!;
  assert(
    sheet.rowCount >= 2 && sheet.rowCount <= 201 && sheet.columnCount <= 5,
    400,
    "IMPORT_SIZE",
    "1–200 data rows and at most five columns required",
  );
  const headers = ["name", "email", "phone", "birthday", "comment"];
  const actual: string[] = [];
  sheet.getRow(1).eachCell((cell, index) => {
    assert(
      typeof cell.value === "string" && headers.includes(cell.value),
      400,
      "IMPORT_HEADERS",
      "Allowed columns: name,email,phone,birthday,comment",
    );
    actual[index - 1] = cell.value;
  });
  assert(
    actual[0] === "name" && new Set(actual).size === actual.length,
    400,
    "IMPORT_HEADERS",
    "First column must be name, unique headers required",
  );
  const output: Record<string, string>[] = [];
  for (let n = 2; n <= sheet.rowCount; n++) {
    const row: Record<string, string> = {};
    sheet.getRow(n).eachCell((cell, index) => {
      assert(
        typeof cell.value === "string" ||
          typeof cell.value === "number" ||
          cell.value instanceof Date,
        400,
        "IMPORT_CELL",
        `Row ${n}: formulas, hyperlinks and rich text unsupported`,
      );
      assert(actual[index - 1], 400, "IMPORT_HEADERS", "Missing column header");
      row[actual[index - 1]!] =
        cell.value instanceof Date
          ? cell.value.toISOString().slice(0, 10)
          : String(cell.value);
    });
    output.push(row);
  }
  return output;
}
export function importRoutes(app: Express) {
  route(
    app,
    "post",
    "/imports/people",
    {
      idem: true,
      body: z
        .object({
          branchId: id,
          kind: z.enum(["people", "payers", "students"]),
          payerId: id.optional(),
          fileBase64: z
            .string()
            .min(1)
            .max(700000)
            .regex(/^[A-Za-z0-9+/]*={0,2}$/),
        })
        .strict(),
      summary: "Atomic XLSX import (200 rows): people, payers or students",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      assert(
        b.kind === "students" ? !!b.payerId : !b.payerId,
        400,
        "IMPORT_PAYER",
        "Student import requires payerId; other kinds must omit it",
      );
      const input = await parseWorkbook(b.fileBase64);
      const result = [];
      for (const [i, row] of input.entries()) {
        try {
          const p = personSchema.parse({
            branchId: b.branchId,
            name: row.name,
            birthday: row.birthday || null,
            comment: row.comment ?? "",
            contacts: [
              ...(row.email ? [{ kind: "email", value: row.email }] : []),
              ...(row.phone ? [{ kind: "phone", value: row.phone }] : []),
            ],
          });
          const person = await createPerson(c, p, true);
          const roleId =
            b.kind === "payers"
              ? await ensurePayer(c, person.id)
              : b.kind === "students"
                ? await ensureStudent(c, person.id, b.payerId)
                : undefined;
          result.push({
            row: i + 2,
            personId: person.id,
            reused: person.reused,
            ...(roleId ? { roleId } : {}),
          });
        } catch (e) {
          if (e instanceof AppError) e.details = { row: i + 2 };
          throw e;
        }
      }
      return { rows: result };
    },
  );
}
