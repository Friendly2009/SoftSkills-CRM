import fs from "node:fs/promises";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");
const SCHEMA_PATH = path.join(CRM_ROOT, "backend", "SqlSchema.sql");

interface SchemaResult {
  success: boolean;
  schema?: string;
  error?: string;
}

export async function readDatabaseSchema(): Promise<SchemaResult> {
  try {
    const content = await fs.readFile(SCHEMA_PATH, "utf-8");

    const lines = content.split(`\(/\r\)?\n/`);
    const cleanSchema = lines
      .filter((line) => {
        const trimmed = line.trim();
        return !trimmed.startsWith("--") && !trimmed.startsWith("#") && trimmed.length > 0;
      })
      .join("\n");

    return {
      success: true,
      schema: cleanSchema,
    };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return {
        success: false,
        error: `Файл схемы базы данных не найден по пути: backend/SqlSchema.sql. Убедитесь, что он существует.`,
      };
    }
    return {
      success: false,
      error: error.message,
    };
  }
}
