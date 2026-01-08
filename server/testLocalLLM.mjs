import { generateExplanation, generateExperiment, initializeModel } from "./services/localLLMService.js";

async function testLocalLLM() {
  console.log("🚀 Testing Local LLM (DistilGPT-2)\n");
  console.log("This runs completely locally - NO API keys needed!\n");

  try {
    // Initialize model
    await initializeModel();

    // Test 1: Simple explanation
    console.log("--- Test 1: Generate Explanation ---");
    const explanation = await generateExplanation("Ohm's Law");
    console.log("Generated:", explanation.text);
    console.log("");

    // Test 2: Experiment
    console.log("--- Test 2: Generate Experiment ---");
    const experiment = await generateExperiment("Photosynthesis", "Light energy converts to chemical energy");
    console.log("Generated:", experiment.text);
    console.log("");

    console.log("✅ All tests completed successfully!\n");
    console.log("📊 Model Info:");
    console.log("   - Name: DistilGPT-2");
    console.log("   - Size: ~300MB");
    console.log("   - Speed: Fast on CPU");
    console.log("   - Cost: FREE (runs locally)");
    console.log("   - Privacy: 100% local, no data sent anywhere\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testLocalLLM();
