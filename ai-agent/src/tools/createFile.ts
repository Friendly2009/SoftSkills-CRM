import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const CRM_ROOT = path.resolve(process.cwd(), "..");

interface CreateFileResult {
  success: boolean;
  gitDiff?: string;
  fileInfo?: {
    relativePath: string;
    size: number;
  };
  error?: string;
}

export async function createFile(
  filePath: string,
  content: string,
): Promise<CreateFileResult> {
  if (!filePath || content === undefined) {
    return { success: false, error: "File path and content are required." };
  }

  const absolutePath = path.resolve(CRM_ROOT, filePath);

  if (
    absolutePath !== CRM_ROOT &&
    !absolutePath.startsWith(CRM_ROOT + path.sep)
  ) {
    return {
      success: false,
      error: "Access denied: Target path is outside the CRM root.",
    };
  }

  try {
    try {
      await fs.access(absolutePath);
      return {
        success: false,
        error: `Accidental overwrite prevented: File already exists at "${filePath}". Use editFile instead if you want to modify it.`,
      };
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }

    console.log(
      `\n================ ПРЕВЬЮ СОЗДАВАЕМОГО ФАЙЛА: ${filePath} ================`,
    );
    console.log(content);
    console.log(
      "========================================================================\n",
    );

    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(
      `⚠️ AI-Agent хочет СОЗДАТЬ новый файл "${filePath}". Разрешить? (y/n): `,
    );
    rl.close();

    if (
      answer.trim().toLowerCase() !== "y" &&
      answer.trim().toLowerCase() !== "yes"
    ) {
      return {
        success: false,
        error:
          "Execution rejected: User denied explicit authorization for file creation.",
      };
    }

    const directoryPath = path.dirname(absolutePath);
    await fs.mkdir(directoryPath, { recursive: true });

    await fs.writeFile(absolutePath, content, "utf-8");

    const lines = content.split(`\(/\r\)?\n/`);
    const gitDiff = lines.map((line) => `+ ${line}`).join("\n");

    const stats = await fs.stat(absolutePath);

    return {
      success: true,
      gitDiff,
      fileInfo: {
        relativePath: path.relative(CRM_ROOT, absolutePath),
        size: stats.size,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to create file: ${error.message}`,
    };
  }
}
