// Reactions Engine Client - Frontend reaction management with LOCAL FALLBACK
// This engine works OFFLINE with built-in reaction database, and syncs with server when available
import axios from 'axios';

// ============================================================================
// CORE REACTION DATABASE (Works offline!)
// ============================================================================
const LOCAL_REACTIONS_DATABASE = [
    {
        id: 'rxn_1',
        chemicals: ['HCl', 'NaOH'],
        reactionType: 'neutralization',
        visualEffect: 'bubbles_heat',
        equation: 'HCl + NaOH → NaCl + H₂O',
        balancedEquation: 'HCl + NaOH → NaCl + H₂O',
        explanation: 'Hydrochloric acid reacts with sodium hydroxide in a classic neutralization reaction. The H⁺ ions from the acid combine with OH⁻ ions from the base to form water, while the remaining ions form sodium chloride (table salt). This exothermic reaction releases heat.',
        resultColor: '#f0f0f0',
        temperature: 'warm',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'acid_base',
        duration: 3,
        safetyWarnings: ['Handle acids and bases with care', 'Wear safety goggles', 'Work in a well-ventilated area']
    },
    {
        id: 'rxn_2',
        chemicals: ['CuSO4', 'NaOH'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
        balancedEquation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
        explanation: 'Copper sulfate solution reacts with sodium hydroxide to form copper hydroxide, a blue precipitate that settles at the bottom. This is a double displacement reaction where the copper ions combine with hydroxide ions to form an insoluble compound.',
        resultColor: '#4A90D9',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'precipitation',
        duration: 4,
        safetyWarnings: ['Copper compounds can be toxic', 'Avoid skin contact', 'Dispose of properly']
    },
    {
        id: 'rxn_3',
        chemicals: ['KMnO4', 'H2SO4', 'FeSO4'],
        reactionType: 'redox',
        visualEffect: 'color_change',
        equation: '2KMnO₄ + 10FeSO₄ + 8H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Fe₂(SO₄)₃ + 8H₂O',
        balancedEquation: '2KMnO₄ + 10FeSO₄ + 8H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Fe₂(SO₄)₃ + 8H₂O',
        explanation: 'Potassium permanganate (purple) is reduced by ferrous sulfate in acidic medium. The Mn⁷⁺ is reduced to Mn²⁺, causing the characteristic purple color to fade to a pale pink or colorless solution, indicating the endpoint of the reaction.',
        resultColor: '#FFE4E1',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'intermediate',
        category: 'redox',
        duration: 5,
        safetyWarnings: ['KMnO4 is a strong oxidizer', 'Can stain skin and clothes', 'Handle with care']
    },
    {
        id: 'rxn_4',
        chemicals: ['Na2CO3', 'HCl'],
        reactionType: 'gas_evolution',
        visualEffect: 'bubbles',
        equation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',
        balancedEquation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',
        explanation: 'Sodium carbonate reacts vigorously with hydrochloric acid, producing carbon dioxide gas (the bubbles you see), water, and sodium chloride. The effervescence is caused by CO₂ escaping from the solution.',
        resultColor: '#f5f5f5',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'acid_base',
        duration: 3,
        safetyWarnings: ['Produces gas - ensure ventilation', 'Handle acid carefully']
    },
    {
        id: 'rxn_5',
        chemicals: ['AgNO3', 'NaCl'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
        balancedEquation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
        explanation: 'Silver nitrate reacts with sodium chloride to form silver chloride, a white precipitate. This reaction is commonly used to test for the presence of chloride ions and is an example of a precipitation reaction.',
        resultColor: '#FFFFFF',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'precipitation',
        duration: 2,
        safetyWarnings: ['AgNO3 stains skin black', 'Handle carefully', 'Dispose of silver waste properly']
    },
    {
        id: 'rxn_6',
        chemicals: ['Zn', 'HCl'],
        reactionType: 'gas_evolution',
        visualEffect: 'bubbles',
        equation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
        balancedEquation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
        explanation: 'Zinc metal reacts with hydrochloric acid to produce hydrogen gas and zinc chloride. The hydrogen gas bubbles vigorously through the solution. This is a single displacement reaction where zinc displaces hydrogen from the acid.',
        resultColor: '#e8e8e8',
        temperature: 'warm',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'redox',
        duration: 5,
        safetyWarnings: ['Hydrogen gas is flammable', 'Keep away from flames', 'Work in ventilated area']
    },
    {
        id: 'rxn_7',
        chemicals: ['Pb(NO3)2', 'KI'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃',
        balancedEquation: 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃',
        explanation: 'Lead nitrate reacts with potassium iodide to form brilliant yellow lead iodide precipitate, often called "golden rain" when the precipitate forms. This beautiful reaction demonstrates precipitation of an insoluble salt.',
        resultColor: '#FFD700',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'precipitation',
        duration: 3,
        safetyWarnings: ['Lead compounds are toxic', 'Avoid ingestion', 'Wash hands thoroughly', 'Dispose as hazardous waste']
    },
    {
        id: 'rxn_8',
        chemicals: ['CaCO3', 'HCl'],
        reactionType: 'gas_evolution',
        visualEffect: 'bubbles',
        equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
        balancedEquation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
        explanation: 'Calcium carbonate (limestone, marble, chalk) reacts with hydrochloric acid to produce carbon dioxide gas, water, and calcium chloride. This reaction demonstrates why acid rain damages limestone buildings and statues.',
        resultColor: '#f0f0f0',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'acid_base',
        duration: 4,
        safetyWarnings: ['Handle acid carefully', 'Produces gas - ensure ventilation']
    },
    {
        id: 'rxn_9',
        chemicals: ['CuSO4', 'Zn'],
        reactionType: 'displacement',
        visualEffect: 'color_change',
        equation: 'Zn + CuSO₄ → ZnSO₄ + Cu',
        balancedEquation: 'Zn + CuSO₄ → ZnSO₄ + Cu',
        explanation: 'Zinc is more reactive than copper, so it displaces copper from copper sulfate solution. The blue color fades as copper sulfate is converted to colorless zinc sulfate, and reddish-brown copper metal deposits on the zinc.',
        resultColor: '#e0e0e0',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'redox',
        duration: 5,
        safetyWarnings: ['Handle copper compounds carefully', 'Wash hands after experiment']
    },
    {
        id: 'rxn_10',
        chemicals: ['BaCl2', 'H2SO4'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl',
        balancedEquation: 'BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl',
        explanation: 'Barium chloride reacts with sulfuric acid to form barium sulfate, a white insoluble precipitate. This reaction is used in qualitative analysis to test for sulfate ions.',
        resultColor: '#FFFFFF',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'intermediate',
        category: 'precipitation',
        duration: 3,
        safetyWarnings: ['Barium compounds are toxic', 'Handle sulfuric acid with extreme care', 'Use protective equipment']
    },
    {
        id: 'rxn_11',
        chemicals: ['NH4Cl', 'NaOH'],
        reactionType: 'gas_evolution',
        visualEffect: 'smoke',
        equation: 'NH₄Cl + NaOH → NaCl + NH₃↑ + H₂O',
        balancedEquation: 'NH₄Cl + NaOH → NaCl + NH₃↑ + H₂O',
        explanation: 'Ammonium chloride reacts with sodium hydroxide to release ammonia gas, which has a characteristic pungent smell. This reaction is used to test for ammonium ions in qualitative analysis.',
        resultColor: '#f5f5f5',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'intermediate',
        category: 'acid_base',
        duration: 4,
        safetyWarnings: ['Ammonia gas is irritating', 'Work in well-ventilated area', 'Avoid inhaling the gas']
    },
    {
        id: 'rxn_12',
        chemicals: ['H2SO4', 'NaOH'],
        reactionType: 'neutralization',
        visualEffect: 'bubbles_heat',
        equation: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
        balancedEquation: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
        explanation: 'Sulfuric acid reacts with sodium hydroxide in a neutralization reaction to form sodium sulfate and water. This reaction is highly exothermic and releases significant heat.',
        resultColor: '#f0f0f0',
        temperature: 'hot',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'acid_base',
        duration: 3,
        safetyWarnings: ['Concentrated H2SO4 is extremely corrosive', 'Add acid to base slowly', 'Wear protective goggles and gloves']
    },
    {
        id: 'rxn_13',
        chemicals: ['CuSO4', 'Na2CO3'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'CuSO₄ + Na₂CO₃ → CuCO₃↓ + Na₂SO₄',
        balancedEquation: 'CuSO₄ + Na₂CO₃ → CuCO₃↓ + Na₂SO₄',
        explanation: 'Copper sulfate reacts with sodium carbonate to form copper carbonate, a green-blue precipitate. This is a double displacement reaction forming an insoluble copper salt.',
        resultColor: '#2E8B57',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'precipitation',
        duration: 3,
        safetyWarnings: ['Copper compounds can be toxic', 'Avoid skin contact']
    },
    {
        id: 'rxn_14',
        chemicals: ['AgNO3', 'Na2CO3'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: '2AgNO₃ + Na₂CO₃ → Ag₂CO₃↓ + 2NaNO₃',
        balancedEquation: '2AgNO₃ + Na₂CO₃ → Ag₂CO₃↓ + 2NaNO₃',
        explanation: 'Silver nitrate reacts with sodium carbonate to form silver carbonate, a white-yellowish precipitate. Silver carbonate decomposes in light.',
        resultColor: '#FFFACD',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'precipitation',
        duration: 2,
        safetyWarnings: ['AgNO3 stains skin black', 'Handle with care']
    },
    {
        id: 'rxn_15',
        chemicals: ['FeSO4', 'NaOH'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄',
        balancedEquation: 'FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄',
        explanation: 'Ferrous sulfate reacts with sodium hydroxide to form ferrous hydroxide, a greenish-white precipitate that turns reddish-brown when exposed to air as it oxidizes to ferric hydroxide.',
        resultColor: '#90EE90',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'precipitation',
        duration: 3,
        safetyWarnings: ['Handle base with care', 'Precipitate oxidizes quickly in air']
    },
    {
        id: 'rxn_16',
        chemicals: ['CuSO4', 'BaCl2'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'CuSO₄ + BaCl₂ → BaSO₄↓ + CuCl₂',
        balancedEquation: 'CuSO₄ + BaCl₂ → BaSO₄↓ + CuCl₂',
        explanation: 'Copper sulfate reacts with barium chloride to form barium sulfate (white precipitate) and copper chloride (blue-green solution). This is a double displacement reaction.',
        resultColor: '#87CEEB',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'intermediate',
        category: 'precipitation',
        duration: 3,
        safetyWarnings: ['Barium compounds are toxic', 'Handle with care']
    },
    {
        id: 'rxn_17',
        chemicals: ['AgNO3', 'HCl'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'AgNO₃ + HCl → AgCl↓ + HNO₃',
        balancedEquation: 'AgNO₃ + HCl → AgCl↓ + HNO₃',
        explanation: 'Silver nitrate reacts with hydrochloric acid to form silver chloride, a white curdy precipitate. This is a classic reaction used to test for chloride ions.',
        resultColor: '#FFFFFF',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'precipitation',
        duration: 2,
        safetyWarnings: ['Handle acids carefully', 'AgNO3 stains skin']
    },
    {
        id: 'rxn_18',
        chemicals: ['Zn', 'CuSO4'],
        reactionType: 'displacement',
        visualEffect: 'color_change',
        equation: 'Zn + CuSO₄ → ZnSO₄ + Cu',
        balancedEquation: 'Zn + CuSO₄ → ZnSO₄ + Cu',
        explanation: 'Zinc displaces copper from copper sulfate solution. The blue color fades as zinc sulfate (colorless) forms, and reddish-brown copper deposits on the zinc metal.',
        resultColor: '#e0e0e0',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'redox',
        duration: 5,
        safetyWarnings: ['Handle chemicals carefully']
    },
    {
        id: 'rxn_19',
        chemicals: ['KMnO4', 'HCl'],
        reactionType: 'redox',
        visualEffect: 'color_change',
        equation: '2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 8H₂O + 5Cl₂↑',
        balancedEquation: '2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 8H₂O + 5Cl₂↑',
        explanation: 'Potassium permanganate reacts with concentrated hydrochloric acid producing chlorine gas. The purple color fades as Mn²⁺ ions form.',
        resultColor: '#FFE4E1',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'advanced',
        category: 'redox',
        duration: 4,
        safetyWarnings: ['Chlorine gas is toxic!', 'Perform in fume hood', 'Avoid inhaling']
    },
    {
        id: 'rxn_20',
        chemicals: ['Pb(NO3)2', 'NaCl'],
        reactionType: 'precipitation',
        visualEffect: 'precipitate',
        equation: 'Pb(NO₃)₂ + 2NaCl → PbCl₂↓ + 2NaNO₃',
        balancedEquation: 'Pb(NO₃)₂ + 2NaCl → PbCl₂↓ + 2NaNO₃',
        explanation: 'Lead nitrate reacts with sodium chloride to form lead chloride, a white precipitate. Lead chloride is slightly soluble in hot water.',
        resultColor: '#FFFFFF',
        temperature: 'room',
        requiresHeat: false,
        difficulty: 'beginner',
        category: 'precipitation',
        duration: 2,
        safetyWarnings: ['Lead compounds are toxic', 'Wash hands thoroughly']
    }
];

// Dangerous chemical combinations that should be prevented
const DANGEROUS_COMBINATIONS = [
    { chemicals: ['H2SO4', 'HNO3'], warning: 'Mixing sulfuric and nitric acid creates extremely dangerous conditions!' },
    { chemicals: ['NaOCl', 'NH3'], warning: 'Bleach + Ammonia produces toxic chloramine gas!' },
    { chemicals: ['H2O2', 'CH3COOH'], warning: 'Hydrogen peroxide + acetic acid can be explosive!' },
    { chemicals: ['K', 'H2O'], warning: 'Potassium reacts violently with water, causing explosion!' },
    { chemicals: ['Na', 'H2O'], warning: 'Sodium reacts violently with water, causing fire!' }
];

class ReactionsEngine {
    constructor() {
        this.reactionsCache = new Map();
        this.effectsCache = new Map();
        this.isServerAvailable = false;
        this.serverReactions = [];
        this.initialized = false;

        // Initialize with local database
        this._initializeLocalCache();
    }

    // Initialize local cache from built-in database
    _initializeLocalCache() {
        LOCAL_REACTIONS_DATABASE.forEach(reaction => {
            const key = this._createReactionKey(reaction.chemicals);
            this.reactionsCache.set(key, reaction);
        });
        console.log(`✅ ReactionsEngine: Loaded ${LOCAL_REACTIONS_DATABASE.length} local reactions`);
    }

    // Create a normalized key for chemical combinations
    _createReactionKey(chemicals) {
        return chemicals.map(c => c.trim().toUpperCase()).sort().join('+');
    }

    // Normalize chemical name
    _normalizeChemical(name) {
        return name.trim().toUpperCase().replace(/\s+/g, '');
    }

    // Check if chemicals match (order independent)
    _chemicalsMatch(chemicals1, chemicals2) {
        const norm1 = chemicals1.map(c => this._normalizeChemical(c)).sort();
        const norm2 = chemicals2.map(c => this._normalizeChemical(c)).sort();
        if (norm1.length !== norm2.length) return false;
        return norm1.every((c, i) => c === norm2[i]);
    }

    // Fetch reactions from backend (if available)
    async fetchReactions() {
        try {
            const response = await axios.get('/api/reactions', { timeout: 5000 });
            if (response.data.success && response.data.reactions) {
                this.serverReactions = response.data.reactions;
                this.isServerAvailable = true;

                // Add server reactions to cache
                response.data.reactions.forEach(r => {
                    const key = this._createReactionKey(r.chemicals);
                    this.reactionsCache.set(key, r);
                });

                console.log(`✅ ReactionsEngine: Synced ${response.data.reactions.length} reactions from server`);
                return response.data.reactions;
            }
            return [];
        } catch (error) {
            console.log('⚠️ ReactionsEngine: Server unavailable, using local database');
            this.isServerAvailable = false;
            return LOCAL_REACTIONS_DATABASE;
        }
    }

    // Calculate reaction for given chemicals - MAIN METHOD
    async calculateReaction(chemicals, conditions = {}) {
        const { isHeated = false, temperature = 'room' } = conditions;

        if (!chemicals || !Array.isArray(chemicals) || chemicals.length < 2) {
            return {
                success: false,
                error: 'insufficient_chemicals',
                message: 'Add at least 2 chemicals to see a reaction.',
                noReaction: true
            };
        }

        console.log('🧪 Calculating reaction for:', chemicals.join(' + '), isHeated ? '(heated)' : '');

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

        // Try server first if available
        if (this.isServerAvailable) {
            try {
                const response = await axios.post('/api/reactions/calculate', {
                    chemicals,
                    isHeated,
                    temperature
                }, { timeout: 5000 });

                if (response.data.success && response.data.reaction) {
                    console.log('✅ Reaction found (server):', response.data.reaction.equation);
                    return response.data;
                }
            } catch (error) {
                console.log('⚠️ Server calculation failed, using local database');
            }
        }

        // Find matching reaction in local cache
        const reaction = this._findLocalReaction(chemicals);

        if (!reaction) {
            console.log('❌ No reaction found for:', chemicals.join(' + '));
            return {
                success: false,
                error: 'no_reaction',
                noReaction: true,
                message: `No reaction occurs between ${chemicals.join(' and ')}.`,
                chemicals: chemicals
            };
        }

        // Check if heat is required
        if (reaction.requiresHeat && !isHeated) {
            return {
                success: false,
                error: 'requires_heat',
                message: 'This reaction requires heat to proceed. Turn on the Bunsen burner.',
                partialReaction: true,
                reaction: reaction
            };
        }

        console.log('✅ Reaction found (local):', reaction.equation);
        return {
            success: true,
            reaction: {
                id: reaction.id,
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

    // Find reaction in local database
    _findLocalReaction(chemicals) {
        const key = this._createReactionKey(chemicals);

        // Direct key match
        if (this.reactionsCache.has(key)) {
            return this.reactionsCache.get(key);
        }

        // Normalize chemical identifier (lowercase, no spaces, no special chars)
        const normalizeChemical = (chem) => {
            return String(chem).toLowerCase().trim().replace(/\s+/g, '').replace(/[₂₃₄⁺⁻]/g, (match) => {
                const map = { '₂': '2', '₃': '3', '₄': '4', '⁺': '+', '⁻': '-' };
                return map[match] || match;
            });
        };

        // Normalize input chemicals for matching
        const inputNormalized = chemicals.map(c => normalizeChemical(c));
        console.log('🔍 Looking for reaction with:', inputNormalized);

        // Search through all reactions for matches
        // Priority 1: Exact match (same chemicals, possibly different order)
        for (const [reactionKey, reaction] of this.reactionsCache) {
            if (reaction.chemicals.length === chemicals.length) {
                const reactionNormalized = reaction.chemicals.map(c => normalizeChemical(c));
                const isMatch = reactionNormalized.every(r => inputNormalized.includes(r)) &&
                    inputNormalized.every(i => reactionNormalized.includes(i));
                if (isMatch) {
                    console.log('✅ Exact match found:', reaction.equation);
                    return reaction;
                }
            }
        }

        // Priority 2: Subset match - find ANY pair that reacts
        // (when container has 3+ chemicals, find if any 2 of them react)
        if (chemicals.length >= 2) {
            let bestMatch = null;
            let bestMatchLength = 0;

            for (const [reactionKey, reaction] of this.reactionsCache) {
                const reactionNormalized = reaction.chemicals.map(c => normalizeChemical(c));

                // Check if all chemicals needed for this reaction are in the container
                const allReactantsPresent = reactionNormalized.every(r =>
                    inputNormalized.some(i => i === r || i.includes(r) || r.includes(i))
                );

                if (allReactantsPresent && reaction.chemicals.length > bestMatchLength) {
                    bestMatch = reaction;
                    bestMatchLength = reaction.chemicals.length;
                }
            }

            if (bestMatch) {
                console.log('✅ Subset match found:', bestMatch.equation);
                return bestMatch;
            }
        }

        console.log('❌ No matching reaction in database');
        return null;
    }

    // Check for dangerous combinations
    isDangerousCombination(chemicals) {
        // Normalize chemical for matching
        const normalize = (chem) => String(chem).toLowerCase().trim().replace(/\s+/g, '');

        const normalized = chemicals.map(c => normalize(c));

        for (const dangerous of DANGEROUS_COMBINATIONS) {
            const normalizedDangerous = dangerous.chemicals.map(c => normalize(c));
            const matches = normalizedDangerous.every(d =>
                normalized.some(c => c.includes(d) || d.includes(c))
            );
            if (matches) {
                return {
                    isDangerous: true,
                    chemicals: dangerous.chemicals,
                    warning: `⚠️ DANGER: ${dangerous.warning}`
                };
            }
        }

        return { isDangerous: false };
    }

    // Check safety
    async checkSafety(chemicals) {
        return this.isDangerousCombination(chemicals);
    }

    // Get visual effect parameters
    getVisualEffectParams(effectType) {
        if (this.effectsCache.has(effectType)) {
            return this.effectsCache.get(effectType);
        }

        const effects = {
            bubbles: {
                count: 50,
                particleColor: '#ffffff',
                minSize: 0.01,
                maxSize: 0.03,
                speed: 0.5,
                lifetime: 3000,
                duration: 3000
            },
            heat: {
                count: 30,
                particleColor: '#ff6600',
                minSize: 0.02,
                maxSize: 0.05,
                speed: 0.3,
                lifetime: 2000,
                duration: 5000
            },
            bubbles_heat: {
                count: 80,
                particleColor: '#ffffff',
                minSize: 0.015,
                maxSize: 0.04,
                speed: 0.8,
                lifetime: 2500,
                duration: 5000
            },
            smoke: {
                count: 100,
                particleColor: '#888888',
                minSize: 0.03,
                maxSize: 0.1,
                speed: 0.3,
                lifetime: 4000,
                duration: 4000
            },
            precipitate: {
                count: 200,
                particleColor: '#ffffff',
                minSize: 0.003,
                maxSize: 0.008,
                speed: 0.2,
                lifetime: 5000,
                duration: 5000
            },
            color_change: {
                count: 40,
                particleColor: '#ffaaff',
                minSize: 0.02,
                maxSize: 0.04,
                speed: 0.4,
                lifetime: 2000,
                duration: 3000
            },
            gas: {
                count: 60,
                particleColor: '#aaddff',
                minSize: 0.02,
                maxSize: 0.05,
                speed: 0.6,
                lifetime: 3000,
                duration: 4000
            },
            flame: {
                count: 100,
                particleColor: '#ff4400',
                minSize: 0.02,
                maxSize: 0.06,
                speed: 1.0,
                lifetime: 1500,
                duration: 5000
            },
            glow: {
                count: 30,
                particleColor: '#aaffaa',
                minSize: 0.03,
                maxSize: 0.08,
                speed: 0.2,
                lifetime: 3000,
                duration: 4000
            }
        };

        const params = effects[effectType] || effects.bubbles;
        this.effectsCache.set(effectType, params);
        return params;
    }

    // Seed reactions (calls server if available)
    async seedReactions() {
        try {
            const response = await axios.post('/api/reactions/seed', {}, { timeout: 5000 });
            if (response.data.success) {
                console.log('✅ Reactions seeded on server');
                await this.fetchReactions();
            }
            return response.data;
        } catch (error) {
            console.log('⚠️ Server seed failed, using local reactions only');
            return { success: true, message: 'Using local database' };
        }
    }

    // Get chemicals list for the lab
    getAvailableChemicals() {
        return [
            { id: 'HCl', name: 'Hydrochloric Acid', formula: 'HCl', color: '#e8e8e8', concentration: '1M', hazard: 'warning' },
            { id: 'NaOH', name: 'Sodium Hydroxide', formula: 'NaOH', color: '#f0f0f0', concentration: '1M', hazard: 'warning' },
            { id: 'CuSO4', name: 'Copper Sulfate', formula: 'CuSO₄', color: '#4A90D9', concentration: '0.5M', hazard: 'caution' },
            { id: 'Na2CO3', name: 'Sodium Carbonate', formula: 'Na₂CO₃', color: '#ffffff', concentration: '1M', hazard: 'safe' },
            { id: 'AgNO3', name: 'Silver Nitrate', formula: 'AgNO₃', color: '#e8e8e8', concentration: '0.1M', hazard: 'warning' },
            { id: 'NaCl', name: 'Sodium Chloride', formula: 'NaCl', color: '#f5f5f5', concentration: '1M', hazard: 'safe' },
            { id: 'H2SO4', name: 'Sulfuric Acid', formula: 'H₂SO₄', color: '#e0e0e0', concentration: '1M', hazard: 'danger' },
            { id: 'KMnO4', name: 'Potassium Permanganate', formula: 'KMnO₄', color: '#8B008B', concentration: '0.1M', hazard: 'warning' },
            { id: 'FeSO4', name: 'Ferrous Sulfate', formula: 'FeSO₄', color: '#90EE90', concentration: '0.5M', hazard: 'caution' },
            { id: 'Zn', name: 'Zinc Metal', formula: 'Zn', color: '#C0C0C0', state: 'solid', hazard: 'safe' },
            { id: 'Pb(NO3)2', name: 'Lead Nitrate', formula: 'Pb(NO₃)₂', color: '#f5f5f5', concentration: '0.5M', hazard: 'danger' },
            { id: 'KI', name: 'Potassium Iodide', formula: 'KI', color: '#f5f5f5', concentration: '0.5M', hazard: 'safe' },
            { id: 'CaCO3', name: 'Calcium Carbonate', formula: 'CaCO₃', color: '#ffffff', state: 'solid', hazard: 'safe' },
            { id: 'NH4Cl', name: 'Ammonium Chloride', formula: 'NH₄Cl', color: '#ffffff', concentration: '1M', hazard: 'caution' },
            { id: 'BaCl2', name: 'Barium Chloride', formula: 'BaCl₂', color: '#f5f5f5', concentration: '0.5M', hazard: 'danger' }
        ];
    }

    // Get apparatus list
    getAvailableApparatus() {
        return [
            { id: 'beaker_small', name: 'Small Beaker', volume: '100ml', model: 'beaker' },
            { id: 'beaker_medium', name: 'Medium Beaker', volume: '250ml', model: 'beaker' },
            { id: 'beaker_large', name: 'Large Beaker', volume: '500ml', model: 'beaker' },
            { id: 'testTube', name: 'Test Tube', volume: '25ml', model: 'testTube' },
            { id: 'flask_conical', name: 'Conical Flask', volume: '250ml', model: 'flask' },
            { id: 'flask_round', name: 'Round Bottom Flask', volume: '500ml', model: 'flask' },
            { id: 'measuringCylinder', name: 'Measuring Cylinder', volume: '100ml', model: 'cylinder' },
            { id: 'pipette', name: 'Pipette', volume: '10ml', model: 'pipette' },
            { id: 'burette', name: 'Burette', volume: '50ml', model: 'burette' },
            { id: 'bunsenBurner', name: 'Bunsen Burner', model: 'burner' },
            { id: 'tripod', name: 'Tripod Stand', model: 'tripod' },
            { id: 'wireGauze', name: 'Wire Gauze', model: 'gauze' },
            { id: 'stirringRod', name: 'Stirring Rod', model: 'rod' },
            { id: 'thermometer', name: 'Thermometer', model: 'thermometer' },
            { id: 'watchGlass', name: 'Watch Glass', model: 'watchGlass' }
        ];
    }

    // Get all available reactions (for display)
    getAllReactions() {
        return Array.from(this.reactionsCache.values());
    }

    // Clear caches
    clearCache() {
        this.reactionsCache.clear();
        this.effectsCache.clear();
        this._initializeLocalCache(); // Reinitialize with local data
    }
}

const reactionsEngine = new ReactionsEngine();
export default reactionsEngine;
