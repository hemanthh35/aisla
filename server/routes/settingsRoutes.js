/**
 * Settings Routes - Admin-only configuration endpoints
 *
 * Provides endpoints for managing application settings including AI provider selection
 */

import express from "express";
import jwt from "jsonwebtoken";
import Settings from "../models/Settings.js";
import User from "../models/User.js";

const router = express.Router();

// Middleware: Verify JWT and check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "aisla_secret_key_2024"
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

/**
 * GET /api/settings/ai
 *
 * Get current AI provider settings
 * Admin only
 */
router.get("/ai", requireAdmin, async (req, res) => {
  try {
    const settings = await Settings.getAISettings();

    // Check provider availability
    let ollamaStatus = { available: false, models: [] };
    let geminiStatus = { available: false };

    // Check Ollama
    try {
      const ollamaUrl = settings.ollamaUrl || "http://localhost:11434";
      const ollamaResponse = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        ollamaStatus = {
          available: true,
          models: data.models?.map((m) => m.name) || [],
        };
      }
    } catch (e) {
      ollamaStatus = {
        available: false,
        models: [],
        error: "Cannot connect to Ollama",
      };
    }

    // Check Gemini API key
    if (process.env.GEMINI_API_KEY) {
      geminiStatus = { available: true };
    }

    res.json({
      settings,
      status: {
        ollama: ollamaStatus,
        gemini: geminiStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching AI settings:", error);
    res.status(500).json({ message: "Failed to fetch AI settings" });
  }
});

/**
 * PUT /api/settings/ai
 *
 * Update AI provider settings
 * Admin only
 */
router.put("/ai", requireAdmin, async (req, res) => {
  try {
    const {
      provider,
      ollamaModel,
      ollamaUrl,
      geminiModel,
      temperature,
      maxTokens,
    } = req.body;

    // Validate provider
    if (provider && !["ollama", "gemini"].includes(provider)) {
      return res
        .status(400)
        .json({ message: 'Invalid provider. Must be "ollama" or "gemini"' });
    }

    // If switching to Gemini, check if API key exists
    if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        message:
          "Gemini API key not configured. Please add GEMINI_API_KEY to server environment.",
      });
    }

    // Get current settings and merge with new ones
    const currentSettings = await Settings.getAISettings();
    const newSettings = {
      ...currentSettings,
      ...(provider && { provider }),
      ...(ollamaModel && { ollamaModel }),
      ...(ollamaUrl && { ollamaUrl }),
      ...(geminiModel && { geminiModel }),
      ...(temperature !== undefined && {
        temperature: parseFloat(temperature),
      }),
      ...(maxTokens !== undefined && { maxTokens: parseInt(maxTokens) }),
    };

    await Settings.setAISettings(newSettings, req.user._id);

    console.log(
      `✅ [SETTINGS] AI provider updated to: ${newSettings.provider} by ${req.user.email}`
    );

    res.json({
      message: "AI settings updated successfully",
      settings: newSettings,
    });
  } catch (error) {
    console.error("Error updating AI settings:", error);
    res.status(500).json({ message: "Failed to update AI settings" });
  }
});

/**
 * POST /api/settings/ai/test
 *
 * Test AI provider connection
 * Admin only
 */
router.post("/ai/test", requireAdmin, async (req, res) => {
  try {
    const { provider } = req.body;

    if (provider === "ollama") {
      const settings = await Settings.getAISettings();
      const ollamaUrl = settings.ollamaUrl || "http://localhost:11434";
      const modelToUse = settings.ollamaModel || "llama3.2:3b";

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelToUse,
          prompt: 'Say "Hello, I am working!" in exactly 5 words.',
          stream: false,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`);
      }

      const data = await response.json();
      res.json({
        success: true,
        provider: "ollama",
        response: data.response,
        model: modelToUse,
      });
    } else if (provider === "gemini") {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          success: false,
          error: "Gemini API key not configured",
        });
      }

      const settings = await Settings.getAISettings();
      const model = settings.geminiModel || "gemini-2.0-flash";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: 'Say "Hello, I am working!" in exactly 5 words.' },
                ],
              },
            ],
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      res.json({
        success: true,
        provider: "gemini",
        response: text,
        model,
      });
    } else {
      res.status(400).json({ success: false, error: "Invalid provider" });
    }
  } catch (error) {
    console.error("AI test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
