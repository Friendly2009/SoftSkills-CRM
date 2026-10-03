import fs from "node:fs/promises";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");

const IGNORED_DIRS = new Set([
    "node_modules",
    ".git",
    "ai-agent",
    "dist",
    "build",
    ".next",
]);

const CODE_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".sql",
    ".html",
    ".css",
]);

async function searchDirectory(
    directory: string,
    query: string,
    results: string[],
): Promise<void> {
    const entries = await fs.readdir(directory, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) {
            continue;
        }

        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            await searchDirectory(fullPath, query, results);
            continue;
        }

        const extension = path.extname(entry.name).toLowerCase();

        if (!CODE_EXTENSIONS.has(extension)) {
            continue;
        }

        try {
            const content = await fs.readFile(fullPath, "utf8");
            const lines = content.split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
                if (
                    lines[i]!
                        .toLowerCase()
                        .includes(query.toLowerCase())
                ) {
                    const relativePath = path.relative(
                        CRM_ROOT,
                        fullPath,
                    );

                    results.push(
                        `${relativePath}:${i + 1}: ${lines[i]!.trim()}`
                    );

                    if (results.length >= 100) {
                        return;
                    }
                }
            }
        } catch {
            // Игнорируем файлы, которые невозможно прочитать
        }

        if (results.length >= 100) {
            return;
        }
    }
}

export async function searchCode(query: string) {
    console.log(`\n🔎 Ищу в CRM: "${query}"`);
    console.log(`📁 Корень CRM: ${CRM_ROOT}`);

    const results: string[] = [];

    await searchDirectory(CRM_ROOT, query, results);

    if (results.length === 0) {
        return {
            success: true,
            query,
            results: "Ничего не найдено.",
        };
    }

    return {
        success: true,
        query,
        results: results.join("\n"),
    };
}