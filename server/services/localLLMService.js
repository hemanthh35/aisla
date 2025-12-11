// AISLA Local LLM Service
// Runs completely locally – NO API keys required

import { pipeline, env } from "@xenova/transformers";

/* ============================
   ENV CONFIGURATION
============================ */
env.allowLocalModels = true;
env.allowRemoteModels = true;

// Performance tuning (important)
env.backends.onnx.wasm.numThreads = 4;

let generator = null;

/* ============================
   INITIALIZE MODEL
============================ */
async function initializeModel() {
  if (!generator) {
    console.log("📥 Loading local LLM (DistilGPT-2)... This may take time.");
    generator = await pipeline(
      "text-generation",
      "Xenova/distilgpt2"
    );
    console.log("✅ Local model loaded successfully!");
  }
  return generator;
}

/* ============================
   BASE TEXT GENERATION
============================ */
async function generateText(prompt, maxTokens = 200) {
  try {
    const model = await initializeModel();

    const result = await model(prompt, {
      max_new_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      do_sample: true,
      repetition_penalty: 1.15,
      no_repeat_ngram_size: 3
    });

    const output = result[0].generated_text
      .replace(prompt, "")
      .trim();

    return { success: true, text: output };

  } catch (error) {
    console.error("❌ Text generation error:", error);
    return { success: false, error: error.message };
  }
}

/* ============================
   EXPERIMENT GENERATOR
============================ */
async function generateExperiment(title, content) {

  const template = `
Experiment Title: ${title}

Aim:
Theory:
Procedure:
Key Formula:
Example:
Common Mistakes:
Real World Application:
Summary:
`;

  const prompt = `
Fill the following experiment template clearly and academically.
Use simple student-friendly language.

${template}

Context:
${content}
`;

  return await generateText(prompt, 300);
}

/* ============================
   SIMPLE EXPLANATION
============================ */
async function generateExplanation(content) {

  const prompt = `
Explain the following topic in very simple words.
Use short sentences and one example.

Topic:
${content}

Explanation:
`;

  return await generateText(prompt, 200);
}

/* ============================
   QUIZ GENERATOR (SAFE MODE)
============================ */
async function generateQuiz(topic) {

  const prompt = `
Generate 3 short questions to test student understanding.

Topic:
${topic}

Write ONLY in this format:
Q1:
Q2:
Q3:
`;

  return await generateText(prompt, 150);
}

/* ============================
   EXPORT FUNCTIONS
============================ */
export {
  initializeModel,
  generateText,
  generateExperiment,
  generateExplanation,
  generateQuiz
};
