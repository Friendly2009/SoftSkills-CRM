import fs from "node:fs/promises";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");

export async function readFile(
    filePath: string,
    startLine?: number,
    endLine?: number,
) {
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
        const content = await fs.readFile(absolutePath, "utf8");
        const lines = content.split(/\r?\n/);

        const start = Math.max((startLine ?? 1) - 1, 0);
        const end = Math.min(endLine ?? lines.length, lines.length);

        const selectedLines = lines
            .slice(start, end)
            .map(
                (line, index) =>
                    `${start + index + 1}: ${line}`,
            )
            .join("\n");

        return {
            success: true,
            filePath,
            startLine: start + 1,
            endLine: end,
            content: selectedLines,
        };
    } catch (error: any) {
        return {
            success: false,
            filePath,
            error: error.message,
        };
    }
}