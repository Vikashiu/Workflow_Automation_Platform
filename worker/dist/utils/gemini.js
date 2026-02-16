"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGeminiContent = generateGeminiContent;
const generative_ai_1 = require("@google/generative-ai");
// Initialize Gemini
// Assumes GEMINI_API_KEY is in process.env
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
function generateGeminiContent(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in env");
        }
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = yield model.generateContent(prompt);
        const response = yield result.response;
        const text = response.text();
        console.log("🤖 Gemini Generated:", text);
        return text;
    });
}
