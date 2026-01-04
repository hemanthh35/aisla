// Reactions Engine Client - Frontend reaction management
import axios from 'axios';

class ReactionsEngine {
    constructor() {
        this.reactionsCache = new Map();
        this.effectsCache = new Map();
    }

    // Fetch all reactions from backend
    async fetchReactions() {
        try {
            const response = await axios.get('/api/reactions');
            if (response.data.success) {
                response.data.reactions.forEach(r => {
                    const key = r.chemicals.sort().join('+');
                    this.reactionsCache.set(key, r);
                });
                return response.data.reactions;
            }
            return [];
        } catch (error) {
            console.error('Error fetching reactions:', error);
            return [];
        }
    }

    // Calculate reaction for given chemicals
    async calculateReaction(chemicals, conditions = {}) {
        try {
            const response = await axios.post('/api/reactions/calculate', {
                chemicals,
                ...conditions
            });
            return response.data;
        } catch (error) {
            console.error('Error calculating reaction:', error);
            return {
                success: false,
                error: 'api_error',
                message: 'Failed to calculate reaction'
            };
        }
    }

    // Check for dangerous combinations
    async checkSafety(chemicals) {
        try {
            const response = await axios.post('/api/reactions/safety-check', { chemicals });
            return response.data;
        } catch (error) {
            console.error('Error checking safety:', error);
            return { isDangerous: false };
        }
    }

    // Get visual effect parameters
    async getEffectParams(effectType) {
        if (this.effectsCache.has(effectType)) {
            return this.effectsCache.get(effectType);
        }

        try {
            const response = await axios.get(`/api/reactions/effects/${effectType}`);
            if (response.data.success) {
                this.effectsCache.set(effectType, response.data.params);
                return response.data.params;
            }
        } catch (error) {
            console.error('Error fetching effect params:', error);
        }

        // Default effect params
        return {
            particleCount: 50,
            particleSize: 0.02,
            particleColor: '#ffffff',
            speed: 0.5,
            duration: 3000
        };
    }

    // Seed initial reactions (for setup)
    async seedReactions() {
        try {
            const response = await axios.post('/api/reactions/seed');
            return response.data;
        } catch (error) {
            console.error('Error seeding reactions:', error);
            return { success: false };
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

    // Clear caches
    clearCache() {
        this.reactionsCache.clear();
        this.effectsCache.clear();
    }
}

const reactionsEngine = new ReactionsEngine();
export default reactionsEngine;
