import fs from "node:fs/promises";
import path from "node:path";

const CRM_ROOT = path.resolve(process.cwd(), "..");
const ROUTER_PATH = path.join(CRM_ROOT, "backend", "router.ts");

interface ApiFlowResult {
  success: boolean;
  flow?: {
    endpoint: string;
    httpMethod: string;
    controllerFile: string;
    handlerFunction: string;
    rawLine: string;
  };
  error?: string;
}

export async function findApiEndpoint(
  routePath: string,
): Promise<ApiFlowResult> {
  if (!routePath) {
    return { success: false, error: "Route path parameter is required." };
  }

  const cleanRoute = routePath.replace(/^\//, "").trim();

  try {
    const content = await fs.readFile(ROUTER_PATH, "utf-8");
    const lines = content.split("\(/\r\)?\n/");

    const importMap = new Map<string, string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("import") && trimmed.includes("from")) {
        const openBrace = trimmed.indexOf("{");
        const closeBrace = trimmed.indexOf("}");
        const fromIdx = trimmed.indexOf("from");

        if (openBrace !== -1 && closeBrace !== -1 && fromIdx !== -1) {
          const functionsText = trimmed.substring(openBrace + 1, closeBrace);
          const functions = functionsText.split(",").map((f) => f.trim());

          let controllerPath = trimmed.substring(fromIdx + 4).trim();
          controllerPath = controllerPath.replace(/['";]/g, "");

          functions.forEach((func) => {
            const parts = func.split(/\s+as\s+/);
            const cleanFunc = parts[0]?.trim();

            if (cleanFunc) {
              importMap.set(cleanFunc, controllerPath);
            }
          });
        }
      }
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) {
        continue;
      }

      if (
        trimmed.includes(`'/${cleanRoute}'`) ||
        trimmed.includes(`"/${cleanRoute}"`)
      ) {
        let httpMethod = "UNKNOWN";
        if (trimmed.includes("router.get")) httpMethod = "GET";
        else if (trimmed.includes("router.post")) httpMethod = "POST";
        else if (trimmed.includes("router.put")) httpMethod = "PUT";
        else if (trimmed.includes("router.delete")) httpMethod = "DELETE";

        const lastComma = trimmed.lastIndexOf(",");
        if (lastComma !== -1) {
          let handlerPart = trimmed.substring(lastComma + 1).trim();
          handlerPart = handlerPart.replace(/\);?/g, "").trim();

          const controllerFile =
            importMap.get(handlerPart) || "UnknownController";

          return {
            success: true,
            flow: {
              endpoint: `/${cleanRoute}`,
              httpMethod,
              controllerFile: controllerFile.replace(/^\.\//, "backend/"),
              handlerFunction: handlerPart,
              rawLine: trimmed,
            },
          };
        }
      }
    }

    return {
      success: false,
      error: `API endpoint matching "${routePath}" not found in router.ts.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to analyze router: ${error.message}`,
    };
  }
}
