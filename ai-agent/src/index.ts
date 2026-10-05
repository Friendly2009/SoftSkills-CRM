import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { searchCode } from "./tools/searchCode.js";
import { readFile } from "./tools/readFile.js";
import { getProjectStructure } from "./tools/getStructure.js";
import { toolsConfig } from "./callTools.js";
import { findReferences } from "./tools/findReference.js";
import { getFileInfo } from "./tools/getFileInfo.js";
import { runTests } from "./tools/runTests.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const prompt =
    "Найди где в контроллерах бэкенда импортируется база данных (pool), прочитай этот файл и объясни, откуда берутся настройки подключения.";

  console.log("🚀 Запуск Agent Tool Loop...");

  let interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    tools: toolsConfig as any,
  });

  while (true) {
    const functionCalls = interaction.steps.filter(
      (step) => step.type === "function_call",
    );

    if (functionCalls.length === 0) {
      break;
    }

    console.log(
      `\n🧠 Модель запросила вызов инструментов (${functionCalls.length}):`,
    );
    const functionResults: any[] = [];

    for (const call of functionCalls) {
      const functionName = call.name;
      const args = call.arguments as Record<string, any>;
      let result: unknown;

      console.log(`  ➡️ Выполнение: ${functionName} с аргументами:`, args);

      try {
        if (functionName === "searchCode") {
          result = await searchCode(String(args.query));
        } else if (functionName === "readFile") {
          result = await readFile(
            String(args.filePath),
            args.startLine !== undefined ? Number(args.startLine) : undefined,
            args.endLine !== undefined ? Number(args.endLine) : undefined,
          );
        } else if (functionName === "getStructure") {
          result = await getProjectStructure(String(args.filePath));
        } else if (functionName === "findReferences") {
          result = await findReferences(String(args.symbol));
        } else if (functionName === "getFileInfo") {
          result = await getFileInfo(String(args.filePath));
        } else if (functionName === "runTypeCheck") {
          const target = args.target === "frontend" ? "frontend" : "backend";
          result = await runTypeCheck(target);
        } else if (functionName === "runTests") {
          const target = args.target === "frontend" ? "frontend" : "backend";
          result = await runTests(target);
        } else {
          result = {
            error: `Инструмент ${functionName} не реализован на бэкенде агента.`,
          };
        }
      } catch (err: any) {
        result = { error: `Ошибка при выполнении инструмента: ${err.message}` };
      }

      functionResults.push({
        type: "function_result",
        call_id: call.id,
        name: functionName,
        result: result,
      });
    }

    await sleep(1500);

    console.log("📥 Отправка результатов инструментов обратно в Gemini...");

    interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: functionResults,
      previous_interaction_id: interaction.id,
      tools: toolsConfig as any,
    });
  }

  console.log("\n🤖 Финальный ответ Gemini:");
  for (const step of interaction.steps) {
    if (step.type === "model_output") {
      console.log(step.content);
    }
  }
}

main().catch((error) => {
  console.error("\n💥 Критическая ошибка в Tool Loop:");
  console.error(error);
});
function runTypeCheck(target: string): unknown {
  throw new Error("Function not implemented.");
}
