import { exec } from "node:child_process";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");
const TEST_TIMEOUT_MS = 30000;

interface TestRunResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error?: string; 
  timedOut: boolean;
}

export function runTests(target: "backend" | "frontend"): Promise<TestRunResult> {
  return new Promise((resolve) => {
    if (target !== "backend" && target !== "frontend") {
      return resolve({
        success: false,
        exitCode: null,
        stdout: "",
        stderr: "",
        timedOut: false,
        error: "Invalid target. Allowed values are 'backend' or 'frontend'.",
      });
    }

    const workingDir = path.join(CRM_ROOT, target);
    const command = "npm run test";

    exec(
      command, 
      { 
        cwd: workingDir,
        timeout: TEST_TIMEOUT_MS 
      }, 
      (error, stdout, stderr) => {
        const exitCode = error 
          ? (typeof error.code === "number" ? error.code : 1) 
          : 0;

        const isTimedOut = error && (error.signal === "SIGTERM" || (error as any).killed) ? true : false;

        const result: TestRunResult = {
          success: exitCode === 0 && !isTimedOut,
          exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          timedOut: isTimedOut,
        };

        if (isTimedOut) {
          result.error = `Test suite execution exceeded timeout of ${TEST_TIMEOUT_MS / 1000} seconds.`;
        } else if (error) {
          result.error = error.message;
        }

        resolve(result);
      }
    );
  });
}
