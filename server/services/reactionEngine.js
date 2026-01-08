// Reaction Engine - Core chemistry simulation logic
import Reaction from '../models/Reaction.js';

class ReactionEngine {
    constructor() {
        this.reactionCache = new Map();
        this.dangerousCombinations = [
            ['H2SO4', 'HNO3'], // Sulfuric + Nitric = explosive
            ['NaOCl', 'NH3'],  // Bleach + Ammonia = toxic gas
            ['H2O2', 'CH3COOH'], // Peroxide + Vinegar = dangerous
            ['K', 'H2O'],       // Potassium + Water = violent reaction
            ['Na', 'H2O'],      // Sodium + Water = violent reaction
        ];
    }

    // Normalize chemical name for comparison
    normalizeChemical(name) {
        return name.trim().toUpperCase().replace(/\s+/g, '');
    }

    // Check if two sets of chemicals match (order independent)
    chemicalsMatch(chemicals1, chemicals2) {
        const norm1 = chemicals1.map(c => this.normalizeChemical(c)).sort();
        const norm2 = chemicals2.map(c => this.normalizeChemical(c)).sort();

        if (norm1.length !== norm2.length) return false;
        return norm1.every((c, i) => c === norm2[i]);
    }

    // Find reaction for given chemicals
    async findReaction(chemicals) {
        // Check cache first
        const cacheKey = chemicals.map(c => this.normalizeChemical(c)).sort().join('+');
        if (this.reactionCache.has(cacheKey)) {
            return this.reactionCache.get(cacheKey);
        }

        // Search database
        const reactions = await Reaction.find({ isActive: true });

        for (const reaction of reactions) {
            if (this.chemicalsMatch(reaction.chemicals, chemicals)) {
                this.reactionCache.set(cacheKey, reaction);
                return reaction;
            }
        }

        return null;
    }

    // Check for dangerous combinations
    isDangerousCombination(chemicals) {
        const normalized = chemicals.map(c => this.normalizeChemical(c));

        for (const dangerous of this.dangerousCombinations) {
            const normalizedDangerous = dangerous.map(c => this.normalizeChemical(c));
            const matches = normalizedDangerous.every(d =>
                normalized.some(c => c.includes(d) || d.includes(c))
            );
            if (matches) {
                return {
                    isDangerous: true,
                    chemicals: dangerous,
                    warning: `⚠️ DANGER: Mixing ${dangerous.join(' and ')} can be extremely hazardous!`
                };
            }
        }

        return { isDangerous: false };
    }

    // Calculate reaction result
    async calculateReaction(chemicals, conditions = {}) {
        const { isHeated = false, temperature = 'room' } = conditions;

        // Check for dangerous combinations first
        const dangerCheck = this.isDangerousCombination(chemicals);
        if (dangerCheck.isDangerous) {
            return {
                success: false,
                error: 'dangerous_combination',
                warning: dangerCheck.warning,
                chemicals: dangerCheck.chemicals
            };
        }

        // Find matching reaction
        const reaction = await this.findReaction(chemicals);

        if (!reaction) {
            return {
                success: false,
                error: 'no_reaction',
                message: 'These chemicals do not react with each other under these conditions.'
            };
        }

        // Check if heat is required
        if (reaction.requiresHeat && !isHeated) {
            return {
                success: false,
                error: 'requires_heat',
                message: 'This reaction requires heat to proceed. Use the Bunsen burner.',
                partialReaction: true
            };
        }

        // Success - return reaction details
        return {
            success: true,
            reaction: {
                id: reaction._id,
                equation: reaction.equation,
                balancedEquation: reaction.balancedEquation || reaction.equation,
                type: reaction.reactionType,
                visualEffect: reaction.visualEffect,
                explanation: reaction.explanation,
                resultColor: reaction.resultColor,
                temperature: reaction.temperature,
                duration: reaction.duration,
                safetyWarnings: reaction.safetyWarnings || []
            }
        };
    }

    // Get visual effect parameters for 3D rendering
    getVisualEffectParams(effectType) {
        const effects = {
            bubbles: {
                particleCount: 50,
                particleSize: 0.02,
                particleColor: '#ffffff',
                speed: 0.5,
                duration: 3000,
                sound: 'bubbling'
            },
            heat: {
                glowIntensity: 2,
                glowColor: '#ff6600',
                steamParticles: 30,
                duration: 5000,
                sound: 'sizzle'
            },
            bubbles_heat: {
                particleCount: 80,
                particleSize: 0.025,
                particleColor: '#ffffff',
                speed: 0.8,
                glowIntensity: 1.5,
                glowColor: '#ff4400',
                duration: 5000,
                sound: 'boiling'
            },
            smoke: {
                particleCount: 100,
                particleSize: 0.1,
                particleColor: '#888888',
                opacity: 0.6,
                riseSpeed: 0.3,
                duration: 4000,
                sound: 'hiss'
            },
            precipitate: {
                fallSpeed: 0.2,
                particleCount: 200,
                particleSize: 0.005,
                settleTime: 3000,
                duration: 5000,
                sound: 'settle'
            },
            color_change: {
                transitionDuration: 2000,
                pulseEffect: true,
                duration: 3000,
                sound: 'magic'
            },
            gas: {
                bubbleCount: 40,
                riseSpeed: 0.4,
                bubbleSize: 0.03,
                duration: 4000,
                sound: 'fizz'
            },
            flame: {
                flameHeight: 0.3,
                flameColor: '#ff4400',
                intensity: 3,
                duration: 5000,
                sound: 'flame'
            },
            glow: {
                glowIntensity: 2.5,
                pulseSpeed: 0.5,
                duration: 4000,
                sound: 'energy'
            }
        };

        return effects[effectType] || effects.bubbles;
    }

    // Clear cache
    clearCache() {
        this.reactionCache.clear();
    }
}

// Singleton instance
const reactionEngine = new ReactionEngine();
export default reactionEngine;
