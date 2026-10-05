import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { searchCode } from "./tools/searchCode.js";
import { readFile } from "./tools/readFile.js";
import { getProjectStructure } from "./tools/getStructure.js";

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
};

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
};

const getStructure = {
  type: 'function',
  name: 'getStructure', 
  description: 'Get the project structure and output a clear tree view.',
  parameters: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the directory relative to the CRM root. Use empty string "" for root.'
      }
    },
    required: ['filePath']
  }
};

const toolsConfig = [searchCodeTool, readFileTool, getStructure];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const prompt =
    "получи полное дерево проекта с помощью getStructure, выведи его структуру на экран и объясни основные особенности архитектуры";

  let interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    tools: toolsConfig as any,
  });

  console.log("\nОтвет/шаги Gemini:\n");

  while (true) {
    let hasFunctionCall = false;

    for (const step of interaction.steps) {
      if (step.type !== "function_call") {
        continue;
      }

      hasFunctionCall = true;
      const functionName = step.name;
      const args = step.arguments as Record<string, any>;

      console.log(`\n🛠 Gemini вызвал инструмент: ${functionName}`, args);
      let result: unknown;

      if (functionName === "searchCode") {
        result = await searchCode(String(args.query));
        console.log("\n📂 Результат поиска:\n");
        console.log((result as any).results ?? (result as any).error);
      }
      else if (functionName === "readFile") {
        result = await readFile(
          String(args.filePath),
          args.startLine !== undefined ? Number(args.startLine) : undefined,
          args.endLine !== undefined ? Number(args.endLine) : undefined,
        );
        console.log("\n📄 Результат чтения файла:\n");
        console.log((result as any).content ?? (result as any).error);
      }
      // ИСПРАВЛЕНО: имя условия строго соответствует объявленному name в getStructure
      else if (functionName === "getStructure") {
        result = await getProjectStructure(String(args.filePath));
        console.log("\nРезультат анализа структуры:\n");
        // ИСПРАВЛЕНО: функция getProjectStructure возвращает свойство data, а не content
        console.log(JSON.stringify((result as any).data ?? (result as any).error, null, 2));
      }
      else {
        console.log(`⚠️ Неизвестный инструмент: ${functionName}`);
        continue;
      }

      await sleep(1000); 

      interaction = await ai.interactions.create({
        model: "gemini-2.5-flash",
        input: [
          {
            type: "function_result",
            call_id: step.id,
            name: functionName,
            result: result,
          },
        ] as any,
        previous_interaction_id: interaction.id,
        tools: toolsConfig as any,
      });

      break;
    }

    if (!hasFunctionCall) {
      for (const step of interaction.steps) {
        if (step.type === "model_output") {
          console.log("\n🤖 Gemini:");
          console.log(step.content);
        }
      }
      break;
    }
  }
}

main().catch((error) => {
  console.error("\nКритическая ошибка выполнения:");
  console.error(error);
});
