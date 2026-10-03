import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { searchCode } from "./tools/searchCode.js";

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

async function main() {
  const prompt =
    "Найди в CRM всё, что связано с созданием клиента. " +
    "Используй searchCode, если тебе нужно найти соответствующий код.";

  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    tools: [searchCodeTool],
  });

  console.log("\nОтвет/шаги Gemini:\n");

  for (const step of interaction.steps) {
    if (step.type === "function_call") {
      console.log(`Gemini вызвал: ${step.name}`, step.arguments);

      if (step.name === "searchCode") {
        const result = await searchCode(String(step.arguments.query));

        console.log("\n📂 Результат поиска:\n");
        console.log(result.results);
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
