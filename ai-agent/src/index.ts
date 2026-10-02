import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

async function main() {
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Попытка ${attempt}/${maxAttempts}...`);

            const response = await ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: "Привет! Проверь, что ты работаешь. Ответь коротко.",
            });

            console.log("\nОтвет Gemini:");
            console.log(response.text);

            return;
        } catch (error: any) {
            const status = error?.status;

            if (status !== 503 || attempt === maxAttempts) {
                throw error;
            }

            const delay = 1000 * 2 ** (attempt - 1);

            console.log(
                `Gemini временно недоступен. Повтор через ${delay / 1000} сек...`
            );

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

main().catch(error => {
    console.error("\nОшибка:");
    console.error(error);
});