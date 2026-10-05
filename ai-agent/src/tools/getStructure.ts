import fs from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "ai-agent",
  "dist",
  "build",
  ".next",
]);

const CRM_ROOT = path.resolve(process.cwd(), "..");

interface FileNode {
  name: string;
  type: "file" | "directory";
  path: string; 
  children?: FileNode[];
}

export async function getProjectStructure(filePath: string = "") {
  const absolutePath = path.resolve(CRM_ROOT, filePath);

  if (
    absolutePath !== CRM_ROOT &&
    !absolutePath.startsWith(CRM_ROOT + path.sep)
  ) {
    return {
      success: false,
      error: "Access denied: path is outside the CRM root.",
    };
  }

  try {
    const structure = await buildTree(absolutePath);
    return { success: true, data: structure };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function buildTree(currentAbsolutePath: string): Promise<FileNode[]> {
  const files = await fs.readdir(currentAbsolutePath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const file of files) {
    if (file.name.startsWith(".") && file.name !== ".hintrc" && file.name !== ".prettierrc") {
      // Можно раскомментировать строку ниже, если хотите полностью скрыть все файлы на "."
      // continue;
    }
    
    if (IGNORED_DIRS.has(file.name)) {
      continue;
    }

    const fileAbsolutePath = path.join(currentAbsolutePath, file.name);
    const relativePath = path.relative(CRM_ROOT, fileAbsolutePath);

    if (file.isDirectory()) {
      nodes.push({
        name: file.name,
        type: "directory",
        path: relativePath,
        children: await buildTree(fileAbsolutePath),
      });
    } else if (file.isFile()) {
      nodes.push({
        name: file.name,
        type: "file",
        path: relativePath,
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
