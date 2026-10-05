import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const CRM_ROOT = path.resolve(process.cwd(), "..");
const BACKUP_DIR = path.resolve(process.cwd(), ".backup");

interface EditFileResult {
  success: boolean;
  diff?: string;
  error?: string;
}

function generateDiff(oldStr: string, newStr: string): string {
  const oldLines = oldStr.split(`\(/\r\)?\n/`);
  const newLines = newStr.split(`\(/\r\)?\n/`);
  let diffText = "";

  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine !== newLine) {
      if (oldLine !== undefined) diffText += `-${i + 1}: ${oldLine}\n`;
      if (newLine !== undefined) diffText += `+${i + 1}: ${newLine}\n`;
    }
  }
  return diffText || "Изменений не обнаружено (контент идентичен).";
}

export async function editFile(
  filePath: string,
  newContent: string,
): Promise<EditFileResult> {
  if (!filePath || newContent === undefined) {
    return { success: false, error: "File path and new content are required." };
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
    let oldContent = "";
    try {
      oldContent = await fs.readFile(absolutePath, "utf-8");
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }

    const fileDiff = generateDiff(oldContent, newContent);

    console.log(
      `\n================ DIFFF ЗАПРОШЕННЫХ ИЗМЕНЕНИЙ С ФАЙЛОМ: ${filePath} ================`,
    );
    console.log(fileDiff);
    console.log(
      "========================================================================\n",
    );

    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(
      `⚠️ AI-Agent хочет изменить файл "${filePath}". Разрешить запись? (y/n): `,
    );
    rl.close();

    if (
      answer.trim().toLowerCase() !== "y" &&
      answer.trim().toLowerCase() !== "yes"
    ) {
      return {
        success: false,
        error:
          "Execution rejected: User denied explicit authorization for file modification.",
      };
    }

    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const timestamp = Date.now();
    const backupFileName = `${path.basename(filePath)}.${timestamp}.bak`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    if (oldContent) {
      await fs.writeFile(backupPath, oldContent, "utf-8");
      console.log(`💾 Создан бэкап старого файла: .backup/${backupFileName}`);
    }

    await fs.writeFile(absolutePath, newContent, "utf-8");

    return {
      success: true,
      diff: fileDiff,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to modify file: ${error.message}`,
    };
  }
}
``;
