import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { searchCode } from "./tools/searchCode.js";
import { readFile } from "./tools/readFile.js";
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const searchCodeTool = {
  type: "function",
  name: "searchCode",
  description:
    "Searches the CRM source code for a text, function name, class name, variable, route, SQL query, or other code-related term. Use this when you need to find where something is implemented in the CRM.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Text or code symbol to search for in the CRM source code.",
      },
    },
    required: ["query"],
  },
} as const;
const readFileTool = {
  type: "function",
  name: "readFile",
  description:
    "Reads a source file from the CRM. Use this after searchCode when you need to inspect the actual implementation.",
  parameters: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Path to the file relative to the CRM root.",
      },
      startLine: {
        type: "number",
        description:
          "Optional first line to read. Defaults to the beginning of the file.",
      },
      endLine: {
        type: "number",
        description:
          "Optional last line to read. Defaults to the end of the file.",
      },
    },
    required: ["filePath"],
  },
} as const;
async function main() {
  const prompt =
    "Найди реализацию ClientController в CRM. " +
    "Сначала используй searchCode, чтобы найти файл. " +
    "После этого используй readFile, чтобы прочитать найденный файл. " +
    "После чтения кратко объясни, что находится в этом файле.";

  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    tools: [searchCodeTool, readFileTool],
  });

  console.log("\nОтвет/шаги Gemini:\n");

  for (const step of interaction.steps) {
    if (step.type === "function_call") {
      const functionName = step.name;
      const args = step.arguments;

      console.log(`🛠 Gemini вызвал: ${functionName}`, args);

      if (functionName === "searchCode") {
        const result = await searchCode(String(args.query));

        console.log("\n📂 Результат поиска:\n");
        console.log(result.results);
      }

      if (functionName === "readFile") {
        const result = await readFile(
          String(args.filePath),
          args.startLine !== undefined ? Number(args.startLine) : undefined,
          args.endLine !== undefined ? Number(args.endLine) : undefined,
        );

        console.log("\n📄 Результат чтения файла:\n");
        console.log(result.content ?? result.error);
      }
    }

    if (step.type === "model_output") {
      console.log("\n🤖 Gemini:");
      console.log(step.content);
    }
  }
}

main().catch((error) => {
  console.error("\nОшибка:");
  console.error(error);
});
