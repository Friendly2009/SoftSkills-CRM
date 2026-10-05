import fs from "node:fs/promises";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");
const IGNORED_DIRS = new Set(["node_modules", ".git", "ai-agent", "dist", "build", ".next", ".vite"]);

interface ReferenceResult {
  filePath: string;
  line: number;
  text: string;
}

export async function findReferences(symbol: string): Promise<{ success: boolean; results?: ReferenceResult[]; error?: string }> {
  if (!symbol || symbol.trim() === "") {
    return { success: false, error: "Symbol name cannot be empty." };
  }

  try {
    const results: ReferenceResult[] = [];
    const regex = new RegExp(`\\b${symbol}\\b`);

    async function scanDirectory(dirPath: string) {
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        if (IGNORED_DIRS.has(file.name) || file.name.startsWith(".")) {
          continue;
        }

        const fullPath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (file.isFile()) {
          if (/\.(ts|tsx|js|jsx|json|sql)\$/.test(file.name)) {
            const content = await fs.readFile(fullPath, "utf-8");
            
            if (!regex.test(content)) continue;

            const lines = content.split(`\(/\r\)?\n/`);

            lines.forEach((lineText, index) => {
              if (regex.test(lineText)) {
                const trimmed = lineText.trim();
                if (!trimmed.startsWith("//") && !trimmed.startsWith("*")) {
                  results.push({
                    filePath: path.relative(CRM_ROOT, fullPath),
                    line: index + 1,
                    text: trimmed,
                  });
                }
              }
            });
          }
        }
      }
    }

    await scanDirectory(CRM_ROOT);
    return { success: true, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
