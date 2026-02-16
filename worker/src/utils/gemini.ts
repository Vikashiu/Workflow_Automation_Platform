
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Assumes GEMINI_API_KEY is in process.env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateGeminiContent(prompt: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in env");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 Gemini Generated:", text);
    return text;
}
