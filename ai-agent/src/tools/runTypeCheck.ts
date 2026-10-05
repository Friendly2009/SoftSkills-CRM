import { exec } from "node:child_process";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");

interface TypeCheckResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

export function runTypeCheck(
  target: "backend" | "frontend",
): Promise<TypeCheckResult> {
  return new Promise((resolve) => {
    if (target !== "backend" && target !== "frontend") {
      return resolve({
        success: false,
        exitCode: null,
        stdout: "",
        stderr: "",
        error: "Invalid target. Allowed targets are 'backend' or 'frontend'.",
      });
    }

    const workingDir = path.join(CRM_ROOT, target);

    const command = "npx tsc --noEmit";

    exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
      const exitCode = error
        ? typeof error.code === "number"
          ? error.code
          : 1
        : 0;

      resolve({
        success: exitCode === 0,
        exitCode,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}
