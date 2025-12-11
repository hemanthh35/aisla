// AI Service - Local LLM Service (No API keys required)
import {
    generateExperiment,
    generateExplanation,
    generateQuiz,
    initializeModel
} from './localLLMService.js';

/**
 * Generate structured experiment from uploaded content
 */
const generateExperimentWrapper = async (title, rawContent) => {
    try {
        return await generateExperiment(title, rawContent);
    } catch (error) {
        console.error('AI Experiment Generation Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate AI explanation for experiment content
 */
const generateExplanationWrapper = async (content, intent = 'simple') => {
    try {
        return await generateExplanation(content);
    } catch (error) {
        console.error('AI Explanation Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate quiz questions for an experiment
 */
const generateStudyGuide = async (experimentContent) => {
    try {
        const contentSummary = experimentContent.content?.summary || 'Quiz topic';
        return await generateQuiz(contentSummary);
    } catch (error) {
        console.error('AI Quiz Generation Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Evaluate quiz submission and generate feedback
 */
const evaluateQuiz = async (questions, userAnswers) => {
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

export {
    generateExperimentWrapper as generateExperiment,
    generateExplanationWrapper as generateExplanation,
    generateStudyGuide,
    generateQuiz,
    evaluateQuiz,
    extractTextFromImage,
    initializeModel
};
