import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp"
});

async function testGemini() {
  const result = await model.generateContent(
    "Explain Ohm's Law in simple words"
  );

  console.log(result.response.text());
}

testGemini();
