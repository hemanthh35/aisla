import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp"
});

async function testGemini() {
  try {
    console.log("Testing Gemini API with new key...\n");
    const result = await model.generateContent(
      "Explain Ohm's Law in simple words"
    );

    console.log("✅ SUCCESS!\n");
    console.log(result.response.text());
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testGemini();
