import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { searchCode } from "./tools/searchCode.js";
import { readFile } from "./tools/readFile.js";
import { getProjectStructure } from "./tools/getStructure.js";
import { searchCodeTool, readFileTool, getStructure } from "./callTools.js";
import { findReferences } from "./tools/findReference.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const toolsConfig = [searchCodeTool, readFileTool, getStructure];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const prompt =
    "проверь рабобтоспособность всех инструментов к каким только у тебя есть доступ";

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
      } else if (functionName === "readFile") {
        result = await readFile(
          String(args.filePath),
          args.startLine !== undefined ? Number(args.startLine) : undefined,
          args.endLine !== undefined ? Number(args.endLine) : undefined,
        );
        console.log("\n📄 Результат чтения файла:\n");
        console.log((result as any).content ?? (result as any).error);
      } else if (functionName === "getStructure") {
        result = await getProjectStructure(String(args.filePath));
        console.log("\nРезультат анализа структуры:\n");
        console.log(
          JSON.stringify(
            (result as any).data ?? (result as any).error,
            null,
            2,
          ),
        );
      } else if (functionName === "findReferences") {
        result = await findReferences(String(args.symbol));
        console.log("\n🔍 Результат поиска связей (findReferences):\n");
        console.log(
          JSON.stringify(
            (result as any).results ?? (result as any).error,
            null,
            2,
          ),
        );
      } else {
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
