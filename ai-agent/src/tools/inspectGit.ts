import { exec } from "node:child_process";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");

interface GitInspectResult {
  success: boolean;
  output: string;
  error?: string;
}

export function inspectGit(command: "status" | "diff" | "branch"): Promise<GitInspectResult> {
  return new Promise((resolve) => {
    if (command !== "status" && command !== "diff" && command !== "branch") {
      return resolve({
        success: false,
        output: "",
        error: "Invalid Git command. Only 'status', 'diff', and 'branch' are allowed.",
      });
    }

    let gitArgs = "";
    if (command === "status") {
      gitArgs = "status --short";
    } else if (command === "diff") {
      gitArgs = "diff";
    } else if (command === "branch") {
      gitArgs = "branch --show-current"; 
    }

    const fullCommand = `git ${gitArgs}`;

    exec(fullCommand, { cwd: CRM_ROOT }, (error, stdout, stderr) => {
      if (error && !stdout) {
        return resolve({
          success: false,
          output: stderr.trim(),
          error: error.message,
        });
      }

      resolve({
        success: true,
        output: stdout.trim() || (command === "status" ? "Рабочая директория чиста" : ""),
      });
    });
  });
}
