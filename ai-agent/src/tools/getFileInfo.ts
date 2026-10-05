import fs from "node:fs/promises";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");

interface FileInfoResult {
  exists: boolean;
  size?: number; // в байтах
  extension?: string;
  mimeType?: string;
  relativePath?: string;
  error?: string;
}

export async function getFileInfo(filePath: string): Promise<FileInfoResult> {
  if (!filePath || filePath.trim() === "") {
    return { exists: false, error: "File path cannot be empty." };
  }

  const absolutePath = path.resolve(CRM_ROOT, filePath);

  if (
    absolutePath !== CRM_ROOT &&
    !absolutePath.startsWith(CRM_ROOT + path.sep)
  ) {
    return {
      exists: false,
      error: "Access denied: path is outside the CRM root.",
    };
  }

  try {
    const stats = await fs.stat(absolutePath);

    if (!stats.isFile()) {
      return {
        exists: true,
        error: "Target path exists but it is a directory, not a file. Use getStructure instead.",
      };
    }

    const ext = path.extname(absolutePath).toLowerCase();

    return {
      exists: true,
      size: stats.size,
      extension: ext,
      relativePath: path.relative(CRM_ROOT, absolutePath),
    };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return {
        exists: false,
        relativePath: path.relative(CRM_ROOT, absolutePath),
      };
    }
    return { exists: false, error: error.message };
  }
}
