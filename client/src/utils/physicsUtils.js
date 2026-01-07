// Physics Lab Utilities - Core physics calculations and constants
// For 3D Physics Lab simulation in AISLA

// ============================================================================
// PHYSICAL CONSTANTS
// ============================================================================

export const CONSTANTS = {
  // Mechanics
  GRAVITY: 9.81, // m/s² (Earth's gravitational acceleration)
  G: 6.674e-11, // Gravitational constant (N⋅m²/kg²)

  // Electromagnetism
  LIGHT_SPEED: 299792458, // m/s
  COULOMB_K: 8.99e9, // N⋅m²/C² (Coulomb's constant)
  VACUUM_PERMITTIVITY: 8.854e-12, // F/m

  // Thermodynamics
  BOLTZMANN: 1.38e-23, // J/K
  AVOGADRO: 6.022e23, // mol⁻¹
  GAS_CONSTANT: 8.314, // J/(mol⋅K)

  // Standard conditions
  ROOM_TEMP: 293, // K (20°C)
  ATM_PRESSURE: 101325, // Pa
};

// ============================================================================
// KINEMATICS - Motion Equations
// ============================================================================

/**
 * Calculate projectile position at time t
 * @param {number} v0 - Initial velocity (m/s)
 * @param {number} angle - Launch angle in degrees
 * @param {number} t - Time (seconds)
 * @returns {{x: number, y: number}} Position
 */
export function getProjectilePosition(v0, angle, t) {
  const angleRad = (angle * Math.PI) / 180;
  const vx = v0 * Math.cos(angleRad);
  const vy = v0 * Math.sin(angleRad);

  return {
    x: vx * t,
    y: vy * t - 0.5 * CONSTANTS.GRAVITY * t * t,
  };
}

/**
 * Calculate projectile range (horizontal distance)
 * @param {number} v0 - Initial velocity (m/s)
 * @param {number} angle - Launch angle in degrees
 * @returns {number} Range in meters
 */
export function getProjectileRange(v0, angle) {
  const angleRad = (angle * Math.PI) / 180;
  return (v0 * v0 * Math.sin(2 * angleRad)) / CONSTANTS.GRAVITY;
}

/**
 * Calculate maximum height of projectile
 * @param {number} v0 - Initial velocity (m/s)
 * @param {number} angle - Launch angle in degrees
 * @returns {number} Maximum height in meters
 */
export function getMaxHeight(v0, angle) {
  const angleRad = (angle * Math.PI) / 180;
  const vy = v0 * Math.sin(angleRad);
  return (vy * vy) / (2 * CONSTANTS.GRAVITY);
}

/**
 * Calculate time of flight for projectile
 * @param {number} v0 - Initial velocity (m/s)
 * @param {number} angle - Launch angle in degrees
 * @returns {number} Time of flight in seconds
 */
export function getTimeOfFlight(v0, angle) {
  const angleRad = (angle * Math.PI) / 180;
  return (2 * v0 * Math.sin(angleRad)) / CONSTANTS.GRAVITY;
}

/**
 * Calculate velocity at time t
 * @param {number} v0 - Initial velocity (m/s)
 * @param {number} angle - Launch angle in degrees
 * @param {number} t - Time (seconds)
 * @returns {{vx: number, vy: number, magnitude: number}} Velocity components
 */
export function getVelocityAtTime(v0, angle, t) {
  const angleRad = (angle * Math.PI) / 180;
  const vx = v0 * Math.cos(angleRad);
  const vy = v0 * Math.sin(angleRad) - CONSTANTS.GRAVITY * t;

  return {
    vx,
    vy,
    magnitude: Math.sqrt(vx * vx + vy * vy),
  };
}

// ============================================================================
// ENERGY - Conservation & Calculations
// ============================================================================

/**
 * Calculate kinetic energy
 * @param {number} mass - Mass in kg
 * @param {number} velocity - Velocity in m/s
 * @returns {number} Kinetic energy in Joules
 */
export function kineticEnergy(mass, velocity) {
  return 0.5 * mass * velocity * velocity;
}

/**
 * Calculate potential energy (gravitational)
 * @param {number} mass - Mass in kg
 * @param {number} height - Height in meters
 * @returns {number} Potential energy in Joules
 */
export function potentialEnergy(mass, height) {
  return mass * CONSTANTS.GRAVITY * height;
}

/**
 * Calculate elastic potential energy (spring)
 * @param {number} k - Spring constant (N/m)
 * @param {number} x - Displacement from equilibrium (m)
 * @returns {number} Elastic potential energy in Joules
 */
export function elasticPotentialEnergy(k, x) {
  return 0.5 * k * x * x;
}

/**
 * Get total mechanical energy
 * @param {number} mass - Mass in kg
 * @param {number} velocity - Velocity in m/s
 * @param {number} height - Height in meters
 * @returns {number} Total mechanical energy in Joules
 */
export function totalMechanicalEnergy(mass, velocity, height) {
  return kineticEnergy(mass, velocity) + potentialEnergy(mass, height);
}

// ============================================================================
// PENDULUM - Oscillation Physics
// ============================================================================

/**
 * Calculate pendulum period (simple harmonic motion)
 * @param {number} length - Pendulum length in meters
 * @returns {number} Period in seconds
 */
export function pendulumPeriod(length) {
  return 2 * Math.PI * Math.sqrt(length / CONSTANTS.GRAVITY);
}

/**
 * Calculate pendulum frequency
 * @param {number} length - Pendulum length in meters
 * @returns {number} Frequency in Hz
 */
export function pendulumFrequency(length) {
  return 1 / pendulumPeriod(length);
}

/**
 * Calculate angular frequency for pendulum
 * @param {number} length - Pendulum length in meters
 * @returns {number} Angular frequency (rad/s)
 */
export function pendulumAngularFrequency(length) {
  return Math.sqrt(CONSTANTS.GRAVITY / length);
}

/**
 * Calculate pendulum position at time t
 * @param {number} amplitude - Initial amplitude (radians)
 * @param {number} length - Pendulum length (m)
 * @param {number} t - Time (s)
 * @returns {number} Angular position (radians)
 */
export function pendulumPosition(amplitude, length, t) {
  const omega = pendulumAngularFrequency(length);
  return amplitude * Math.cos(omega * t);
}

// ============================================================================
// COLLISIONS - Momentum & Impact
// ============================================================================

/**
 * Calculate elastic collision result (1D)
 * @param {number} m1 - Mass of object 1
 * @param {number} v1 - Velocity of object 1 before collision
 * @param {number} m2 - Mass of object 2
 * @param {number} v2 - Velocity of object 2 before collision
 * @returns {{v1f: number, v2f: number}} Final velocities
 */
export function elasticCollision(m1, v1, m2, v2) {
  const v1f = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
  const v2f = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
  return { v1f, v2f };
}

/**
 * Calculate inelastic collision result (objects stick together)
 * @param {number} m1 - Mass of object 1
 * @param {number} v1 - Velocity of object 1
 * @param {number} m2 - Mass of object 2
 * @param {number} v2 - Velocity of object 2
 * @returns {number} Final velocity of combined mass
 */
export function inelasticCollision(m1, v1, m2, v2) {
  return (m1 * v1 + m2 * v2) / (m1 + m2);
}

/**
 * Calculate momentum
 * @param {number} mass - Mass in kg
 * @param {number} velocity - Velocity in m/s
 * @returns {number} Momentum in kg⋅m/s
 */
export function momentum(mass, velocity) {
  return mass * velocity;
}

/**
 * Calculate impulse
 * @param {number} force - Force in N
 * @param {number} time - Time duration in s
 * @returns {number} Impulse in N⋅s
 */
export function impulse(force, time) {
  return force * time;
}

// ============================================================================
// INCLINED PLANE - Forces & Acceleration
// ============================================================================

/**
 * Calculate acceleration on frictionless inclined plane
 * @param {number} angle - Angle in degrees
 * @returns {number} Acceleration in m/s²
 */
export function inclinedPlaneAcceleration(angle) {
  const angleRad = (angle * Math.PI) / 180;
  return CONSTANTS.GRAVITY * Math.sin(angleRad);
}

/**
 * Calculate acceleration with friction
 * @param {number} angle - Angle in degrees
 * @param {number} mu - Coefficient of friction
 * @returns {number} Acceleration in m/s²
 */
export function inclinedPlaneWithFriction(angle, mu) {
  const angleRad = (angle * Math.PI) / 180;
  const gSin = CONSTANTS.GRAVITY * Math.sin(angleRad);
  const gCos = CONSTANTS.GRAVITY * Math.cos(angleRad);
  return gSin - mu * gCos;
}

/**
 * Calculate velocity at bottom of inclined plane
 * @param {number} height - Height of plane (m)
 * @returns {number} Velocity at bottom (m/s)
 */
export function velocityAtBottom(height) {
  return Math.sqrt(2 * CONSTANTS.GRAVITY * height);
}

// ============================================================================
// SPRING PHYSICS - Hooke's Law
// ============================================================================

/**
 * Calculate spring force (Hooke's Law)
 * @param {number} k - Spring constant (N/m)
 * @param {number} x - Displacement (m)
 * @returns {number} Force in N (negative = restoring)
 */
export function springForce(k, x) {
  return -k * x;
}

/**
 * Calculate spring oscillation period
 * @param {number} mass - Mass attached to spring (kg)
 * @param {number} k - Spring constant (N/m)
 * @returns {number} Period in seconds
 */
export function springPeriod(mass, k) {
  return 2 * Math.PI * Math.sqrt(mass / k);
}

/**
 * Calculate spring position at time t
 * @param {number} amplitude - Initial amplitude (m)
 * @param {number} mass - Mass (kg)
 * @param {number} k - Spring constant (N/m)
 * @param {number} t - Time (s)
 * @returns {number} Position (m)
 */
export function springPosition(amplitude, mass, k, t) {
  const omega = Math.sqrt(k / mass);
  return amplitude * Math.cos(omega * t);
}

// ============================================================================
// WAVE PHYSICS
// ============================================================================

/**
 * Calculate wavelength
 * @param {number} velocity - Wave velocity (m/s)
 * @param {number} frequency - Frequency (Hz)
 * @returns {number} Wavelength in meters
 */
export function wavelength(velocity, frequency) {
  return velocity / frequency;
}

/**
 * Calculate wave speed on string
 * @param {number} tension - Tension in N
 * @param {number} linearDensity - Mass per unit length (kg/m)
 * @returns {number} Wave speed in m/s
 */
export function waveSpeedOnString(tension, linearDensity) {
  return Math.sqrt(tension / linearDensity);
}

/**
 * Calculate standing wave frequency (nth harmonic)
 * @param {number} n - Harmonic number (1, 2, 3...)
 * @param {number} v - Wave velocity (m/s)
 * @param {number} L - Length of medium (m)
 * @returns {number} Frequency in Hz
 */
export function standingWaveFrequency(n, v, L) {
  return (n * v) / (2 * L);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
export function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 * @param {number} radians
 * @returns {number} degrees
 */
export function radToDeg(radians) {
  return (radians * 180) / Math.PI;
}

/**
 * Format number with appropriate precision
 * @param {number} value
 * @param {number} precision - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatValue(value, precision = 2) {
  if (Math.abs(value) < 0.01 || Math.abs(value) > 10000) {
    return value.toExponential(precision);
  }
  return value.toFixed(precision);
}

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ============================================================================
// EXPERIMENT PRESETS
// ============================================================================

export const EXPERIMENT_PRESETS = {
  projectileMotion: {
    id: "projectile_motion",
    name: "Projectile Motion",
    category: "mechanics",
    icon: "🎯",
    description:
      "Launch projectiles at different angles and observe parabolic trajectories",
    difficulty: "beginner",
    variables: [
      {
        name: "velocity",
        label: "Initial Velocity",
        min: 1,
        max: 50,
        default: 20,
        unit: "m/s",
      },
      {
        name: "angle",
        label: "Launch Angle",
        min: 0,
        max: 90,
        default: 45,
        unit: "°",
      },
    ],
    formulas: ["R = v₀²sin(2θ)/g", "H = v₀²sin²(θ)/2g", "T = 2v₀sin(θ)/g"],
  },
  pendulum: {
    id: "pendulum",
    name: "Simple Pendulum",
    category: "mechanics",
    icon: "🔔",
    description: "Study oscillatory motion and period of a simple pendulum",
    difficulty: "beginner",
    variables: [
      {
        name: "length",
        label: "Pendulum Length",
        min: 0.1,
        max: 3,
        default: 1,
        unit: "m",
      },
      {
        name: "amplitude",
        label: "Initial Angle",
        min: 5,
        max: 45,
        default: 15,
        unit: "°",
      },
    ],
    formulas: ["T = 2π√(L/g)", "f = 1/T", "θ(t) = θ₀cos(ωt)"],
  },
  collision: {
    id: "collision",
    name: "Elastic Collision",
    category: "mechanics",
    icon: "💥",
    description:
      "Observe momentum and energy conservation in elastic collisions",
    difficulty: "intermediate",
    variables: [
      {
        name: "mass1",
        label: "Mass 1",
        min: 0.1,
        max: 10,
        default: 2,
        unit: "kg",
      },
      {
        name: "mass2",
        label: "Mass 2",
        min: 0.1,
        max: 10,
        default: 2,
        unit: "kg",
      },
      {
        name: "velocity1",
        label: "Velocity 1",
        min: -10,
        max: 10,
        default: 5,
        unit: "m/s",
      },
      {
        name: "velocity2",
        label: "Velocity 2",
        min: -10,
        max: 10,
        default: 0,
        unit: "m/s",
      },
    ],
    formulas: ["p = mv", "p₁ + p₂ = p₁' + p₂'", "KE = ½mv²"],
  },
  inclinedPlane: {
    id: "inclined_plane",
    name: "Inclined Plane",
    category: "mechanics",
    icon: "📐",
    description: "Study motion on inclined surfaces with and without friction",
    difficulty: "beginner",
    variables: [
      {
        name: "angle",
        label: "Incline Angle",
        min: 5,
        max: 60,
        default: 30,
        unit: "°",
      },
      {
        name: "mass",
        label: "Object Mass",
        min: 0.1,
        max: 10,
        default: 1,
        unit: "kg",
      },
      {
        name: "friction",
        label: "Friction Coefficient",
        min: 0,
        max: 1,
        default: 0,
        unit: "",
      },
    ],
    formulas: ["a = g·sin(θ)", "a = g(sin(θ) - μcos(θ))", "v = √(2gh)"],
  },
  springOscillator: {
    id: "spring_oscillator",
    name: "Spring Oscillator",
    category: "mechanics",
    icon: "🔩",
    description: "Explore simple harmonic motion with a spring-mass system",
    difficulty: "intermediate",
    variables: [
      { name: "mass", label: "Mass", min: 0.1, max: 5, default: 1, unit: "kg" },
      {
        name: "springConstant",
        label: "Spring Constant",
        min: 1,
        max: 100,
        default: 20,
        unit: "N/m",
      },
      {
        name: "amplitude",
        label: "Initial Displacement",
        min: 0.01,
        max: 0.5,
        default: 0.1,
        unit: "m",
      },
    ],
    formulas: ["F = -kx", "T = 2π√(m/k)", "E = ½kA²"],
  },
  newtonsCradle: {
    id: "newtons_cradle",
    name: "Newton's Cradle",
    category: "mechanics",
    icon: "⚪",
    description:
      "Visualize momentum transfer in a classic physics demonstration",
    difficulty: "beginner",
    variables: [
      {
        name: "balls",
        label: "Number of Balls",
        min: 3,
        max: 7,
        default: 5,
        unit: "",
      },
      {
        name: "pullBack",
        label: "Pull Back Count",
        min: 1,
        max: 3,
        default: 1,
        unit: "",
      },
    ],
    formulas: ["p₁ = p₂", "mv₁ = mv₂", "KE conserved"],
  },
  freeFall: {
    id: "free_fall",
    name: "Free Fall",
    category: "mechanics",
    icon: "⬇️",
    description: "Study objects falling under gravity from various heights",
    difficulty: "beginner",
    variables: [
      {
        name: "height",
        label: "Drop Height",
        min: 1,
        max: 20,
        default: 10,
        unit: "m",
      },
      {
        name: "mass",
        label: "Object Mass",
        min: 0.1,
        max: 10,
        default: 1,
        unit: "kg",
      },
    ],
    formulas: ["v = √(2gh)", "t = √(2h/g)", "h = ½gt²"],
  },
  circularMotion: {
    id: "circular_motion",
    name: "Circular Motion",
    category: "mechanics",
    icon: "🔄",
    description: "Explore uniform circular motion and centripetal force",
    difficulty: "intermediate",
    variables: [
      {
        name: "radius",
        label: "Orbit Radius",
        min: 0.5,
        max: 5,
        default: 2,
        unit: "m",
      },
      {
        name: "speed",
        label: "Linear Speed",
        min: 1,
        max: 10,
        default: 5,
        unit: "m/s",
      },
      {
        name: "mass",
        label: "Object Mass",
        min: 0.1,
        max: 5,
        default: 1,
        unit: "kg",
      },
    ],
    formulas: ["a = v²/r", "F = mv²/r", "T = 2πr/v"],
  },
  waveMotion: {
    id: "wave_motion",
    name: "Wave Motion",
    category: "waves",
    icon: "🌊",
    description: "Visualize transverse waves and wave properties",
    difficulty: "intermediate",
    variables: [
      {
        name: "amplitude",
        label: "Amplitude",
        min: 0.1,
        max: 2,
        default: 0.5,
        unit: "m",
      },
      {
        name: "wavelength",
        label: "Wavelength",
        min: 1,
        max: 5,
        default: 2,
        unit: "m",
      },
      {
        name: "frequency",
        label: "Frequency",
        min: 0.5,
        max: 5,
        default: 1,
        unit: "Hz",
      },
    ],
    formulas: ["v = fλ", "y = A sin(kx - ωt)", "ω = 2πf"],
  },
  atwoodMachine: {
    id: "atwood_machine",
    name: "Atwood Machine",
    category: "mechanics",
    icon: "⚖️",
    description: "Study acceleration with two masses connected by a pulley",
    difficulty: "intermediate",
    variables: [
      {
        name: "mass1",
        label: "Mass 1 (heavier)",
        min: 1,
        max: 10,
        default: 3,
        unit: "kg",
      },
      {
        name: "mass2",
        label: "Mass 2 (lighter)",
        min: 0.5,
        max: 9,
        default: 2,
        unit: "kg",
      },
    ],
    formulas: ["a = (m₁-m₂)g/(m₁+m₂)", "T = 2m₁m₂g/(m₁+m₂)"],
  },
};

export default {
  CONSTANTS,
  // Kinematics
  getProjectilePosition,
  getProjectileRange,
  getMaxHeight,
  getTimeOfFlight,
  getVelocityAtTime,
  // Energy
  kineticEnergy,
  potentialEnergy,
  elasticPotentialEnergy,
  totalMechanicalEnergy,
  // Pendulum
  pendulumPeriod,
  pendulumFrequency,
  pendulumAngularFrequency,
  pendulumPosition,
  // Collisions
  elasticCollision,
  inelasticCollision,
  momentum,
  impulse,
  // Inclined plane
  inclinedPlaneAcceleration,
  inclinedPlaneWithFriction,
  velocityAtBottom,
  // Spring
  springForce,
  springPeriod,
  springPosition,
  // Waves
  wavelength,
  waveSpeedOnString,
  standingWaveFrequency,
  // Utilities
  degToRad,
  radToDeg,
  formatValue,
  clamp,
  lerp,
  // Presets
  EXPERIMENT_PRESETS,
};
