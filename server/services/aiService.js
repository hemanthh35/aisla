// AI Service - Local LLM Service (No API keys required)
import { generateExperiment as llmGenerateExperiment, generateExplanation as llmGenerateExplanation, generateQuiz as llmGenerateQuiz } from './localLLMService.js';

/**
 * Generate structured experiment from uploaded content
 */
const generateExperiment = async (title, rawContent) => {
    try {
        return await llmGenerateExperiment(title, rawContent);
    } catch (error) {
        console.error('AI Experiment Generation Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate AI explanation for experiment content
 */
const generateExplanation = async (content, intent = 'simple') => {
    try {
        return await llmGenerateExplanation(content);
    } catch (error) {
        console.error('AI Explanation Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate quiz questions for an experiment
 */
const generateQuiz = async (experimentContent) => {
    try {
        const contentSummary = experimentContent?.summary || 'Quiz topic';
        return await llmGenerateQuiz(contentSummary);
    } catch (error) {
        console.error('AI Quiz Generation Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Evaluate quiz submission and generate feedback
 */
const evaluateQuizFunc = async (questions, userAnswers) => {
    try {
        return { 
            success: true, 
            evaluation: {
                results: questions.map((q, i) => ({
                    questionIndex: i,
                    isCorrect: q.answer === userAnswers[i],
                    feedback: 'Answer recorded'
                })),
                overallFeedback: 'Quiz evaluation complete',
                topicsToRevise: [],
                strengths: ['Good effort'],
                suggestions: ['Keep learning']
            }
        };
    } catch (error) {
        console.error('AI Quiz Evaluation Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Extract text from image using OCR (placeholder)
 */
const extractTextFromImage = async (imageBase64) => {
    try {
        return { success: true, text: 'Image text extraction - feature coming soon' };
    } catch (error) {
        console.error('OCR Error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    generateExperiment,
    generateExplanation,
    generateQuiz,
    evaluateQuiz: evaluateQuizFunc,
    extractTextFromImage
};