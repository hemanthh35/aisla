// Chemistry Lab Physics Utilities
// Handles physics calculations for the 3D lab simulation

export const GRAVITY = 9.81;
export const LIQUID_DENSITY = 1000; // kg/m³ for water

// Calculate pouring physics
export function calculatePourTrajectory(startPos, endPos, pourSpeed = 1) {
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const dz = endPos.z - startPos.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const duration = distance / pourSpeed;

    return {
        dx: dx / duration,
        dy: dy / duration,
        dz: dz / duration,
        duration
    };
}

// Calculate liquid level based on volume
export function calculateLiquidLevel(volume, containerRadius, maxHeight) {
    const area = Math.PI * containerRadius * containerRadius;
    return Math.min(volume / area, maxHeight);
}

// Color mixing for liquid combinations
export function mixColors(color1, color2, ratio = 0.5) {
    const parseHex = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    };

    const c1 = parseHex(color1);
    const c2 = parseHex(color2);

    const mixed = {
        r: Math.round(c1.r * (1 - ratio) + c2.r * ratio),
        g: Math.round(c1.g * (1 - ratio) + c2.g * ratio),
        b: Math.round(c1.b * (1 - ratio) + c2.b * ratio)
    };

    return `#${mixed.r.toString(16).padStart(2, '0')}${mixed.g.toString(16).padStart(2, '0')}${mixed.b.toString(16).padStart(2, '0')}`;
}

// Temperature simulation
export function calculateTemperatureChange(initialTemp, heatApplied, time, coolingRate = 0.1) {
    if (heatApplied) {
        return initialTemp + (time * 5); // Heating increases temp
    }
    // Natural cooling
    const ambientTemp = 25;
    return initialTemp + (ambientTemp - initialTemp) * coolingRate * time;
}

// Particle system parameters for effects
export function getParticleParams(effectType, intensity = 1) {
    const baseParams = {
        bubbles: {
            count: 50,
            minSize: 0.005,
            maxSize: 0.02,
            speed: 0.3,
            lifetime: 2000,
            particleColor: '#ffffff',
            duration: 3000,
            opacity: 0.6
        },
        bubbles_heat: {
            count: 80,
            minSize: 0.008,
            maxSize: 0.025,
            speed: 0.5,
            lifetime: 2500,
            particleColor: '#ffffee',
            duration: 5000,
            opacity: 0.7
        },
        heat: {
            count: 30,
            minSize: 0.01,
            maxSize: 0.04,
            speed: 0.4,
            lifetime: 1500,
            particleColor: '#ff6600',
            duration: 4000,
            opacity: 0.6
        },
        steam: {
            count: 30,
            minSize: 0.02,
            maxSize: 0.08,
            speed: 0.2,
            lifetime: 3000,
            particleColor: '#ffffff',
            duration: 4000,
            opacity: 0.3
        },
        smoke: {
            count: 80,
            minSize: 0.03,
            maxSize: 0.1,
            speed: 0.15,
            lifetime: 4000,
            particleColor: '#888888',
            duration: 4000,
            opacity: 0.5
        },
        precipitate: {
            count: 200,
            minSize: 0.003,
            maxSize: 0.008,
            speed: 0.1,
            lifetime: 5000,
            particleColor: '#ffffff',
            duration: 5000,
            opacity: 0.9
        },
        color_change: {
            count: 40,
            minSize: 0.01,
            maxSize: 0.03,
            speed: 0.3,
            lifetime: 2000,
            particleColor: '#aabbff',
            duration: 3000,
            opacity: 0.6
        },
        gas: {
            count: 60,
            minSize: 0.015,
            maxSize: 0.04,
            speed: 0.4,
            lifetime: 3000,
            particleColor: '#aaddff',
            duration: 4000,
            opacity: 0.5
        },
        flame: {
            count: 100,
            minSize: 0.02,
            maxSize: 0.06,
            speed: 0.8,
            lifetime: 1000,
            particleColor: '#ff4400',
            duration: 5000,
            opacity: 0.8
        },
        glow: {
            count: 30,
            minSize: 0.02,
            maxSize: 0.06,
            speed: 0.2,
            lifetime: 3000,
            particleColor: '#aaffaa',
            duration: 4000,
            opacity: 0.6
        },
        sparks: {
            count: 20,
            minSize: 0.01,
            maxSize: 0.02,
            speed: 0.8,
            lifetime: 500,
            particleColor: '#ffaa00',
            duration: 2000,
            opacity: 1
        },
        gas_evolution: {
            count: 70,
            minSize: 0.01,
            maxSize: 0.03,
            speed: 0.5,
            lifetime: 2500,
            particleColor: '#ccefff',
            duration: 4000,
            opacity: 0.6
        }
    };

    const params = baseParams[effectType] || baseParams.bubbles;

    return {
        ...params,
        count: Math.round(params.count * intensity),
        speed: params.speed * intensity
    };
}

// Container volume calculations
export function getContainerVolume(containerType) {
    const volumes = {
        beaker_small: 100,    // ml
        beaker_medium: 250,
        beaker_large: 500,
        testTube: 25,
        flask_conical: 250,
        flask_round: 500,
        measuringCylinder: 100,
        pipette: 10,
        burette: 50
    };

    return volumes[containerType] || 100;
}

// Check if containers can interact
export function canInteract(sourceType, targetType) {
    const pourableToType = {
        beaker_small: ['beaker_medium', 'beaker_large', 'flask_conical', 'flask_round', 'testTube'],
        beaker_medium: ['beaker_large', 'flask_conical', 'flask_round'],
        beaker_large: ['flask_round'],
        testTube: ['beaker_small', 'beaker_medium', 'flask_conical'],
        flask_conical: ['beaker_large', 'flask_round'],
        measuringCylinder: ['beaker_small', 'beaker_medium', 'beaker_large', 'flask_conical', 'testTube'],
        pipette: ['beaker_small', 'beaker_medium', 'testTube', 'flask_conical'],
        burette: ['beaker_small', 'beaker_medium', 'flask_conical']
    };

    return pourableToType[sourceType]?.includes(targetType) || false;
}

// Collision detection for 3D objects
export function checkCollision(obj1Pos, obj1Size, obj2Pos, obj2Size) {
    const dx = Math.abs(obj1Pos.x - obj2Pos.x);
    const dy = Math.abs(obj1Pos.y - obj2Pos.y);
    const dz = Math.abs(obj1Pos.z - obj2Pos.z);

    const combinedSizeX = (obj1Size.x + obj2Size.x) / 2;
    const combinedSizeY = (obj1Size.y + obj2Size.y) / 2;
    const combinedSizeZ = (obj1Size.z + obj2Size.z) / 2;

    return dx < combinedSizeX && dy < combinedSizeY && dz < combinedSizeZ;
}

export default {
    calculatePourTrajectory,
    calculateLiquidLevel,
    mixColors,
    calculateTemperatureChange,
    getParticleParams,
    getContainerVolume,
    canInteract,
    checkCollision,
    GRAVITY,
    LIQUID_DENSITY
};
