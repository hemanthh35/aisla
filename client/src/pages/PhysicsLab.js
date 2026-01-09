// Physics 3D Lab - Interactive Physics Simulation Platform
// Enhanced with live animations, trajectory trails, and AI explanations

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { GridMaterial } from "@babylonjs/materials";
import axios from "axios";
import {
  EXPERIMENT_PRESETS,
  getProjectilePosition,
  getProjectileRange,
  getMaxHeight,
  getTimeOfFlight,
  pendulumPeriod,
  pendulumPosition,
  elasticCollision,
  inclinedPlaneAcceleration,
  springPosition,
  springPeriod,
  formatValue,
  CONSTANTS,
} from "../utils/physicsUtils";
import "./PhysicsLab.css";

const PhysicsLab = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const cameraRef = useRef(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [experimentParams, setExperimentParams] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const [measurements, setMeasurements] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showExperimentPanel, setShowExperimentPanel] = useState(true);
  const [theoreticalValues, setTheoreticalValues] = useState({});

  // AI Explanation state
  const [aiExplanation, setAiExplanation] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Refs for simulation - using refs to avoid stale closures
  const isSimulatingRef = useRef(false);
  const experimentParamsRef = useRef({});
  const projectileRef = useRef(null);
  const pendulumRef = useRef(null);
  const collisionObjectsRef = useRef([]);
  const trajectoryPointsRef = useRef([]);
  const trajectoryMeshRef = useRef(null);
  const simulationDataRef = useRef({
    positions: [],
    velocities: [],
    times: [],
  });
  const startTimeRef = useRef(0);
  const launcherRef = useRef(null);
  const particleSystemRef = useRef(null);

  // Track ALL experiment meshes for proper cleanup
  const experimentMeshesRef = useRef([]);

  // Debounce timer for slider updates
  const debounceTimerRef = useRef(null);

  // Experiments list
  const experiments = Object.values(EXPERIMENT_PRESETS);

  // Keep experimentParams ref in sync
  useEffect(() => {
    experimentParamsRef.current = experimentParams;
  }, [experimentParams]);

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) return;

    let engine = null;
    let scene = null;

    const initScene = async () => {
      engine = new BABYLON.Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      engineRef.current = engine;

      scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.05, 1);
      sceneRef.current = scene;

      // Camera
      const camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 3.5,
        15,
        new BABYLON.Vector3(0, 2, 0),
        scene
      );
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 5;
      camera.upperRadiusLimit = 30;
      camera.wheelPrecision = 15;
      cameraRef.current = camera;

      // Lighting
      const hemiLight = new BABYLON.HemisphericLight(
        "hemiLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      hemiLight.intensity = 0.5;
      hemiLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.15);

      const dirLight = new BABYLON.DirectionalLight(
        "dirLight",
        new BABYLON.Vector3(-1, -2, -1),
        scene
      );
      dirLight.position = new BABYLON.Vector3(5, 10, 5);
      dirLight.intensity = 0.8;

      // Shadows
      const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
      shadowGenerator.useBlurExponentialShadowMap = true;
      shadowGenerator.blurKernel = 32;

      // Environment
      const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        "https://assets.babylonjs.com/environments/environmentSpecular.env",
        scene
      );
      scene.environmentTexture = envTexture;
      scene.environmentIntensity = 0.5;

      // Create environment
      createLabEnvironment(scene, shadowGenerator);

      // Render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      window.addEventListener("resize", () => engine?.resize());

      setIsLoading(false);
    };

    initScene();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      engine?.stopRenderLoop();
      scene?.dispose();
      engine?.dispose();
    };
  }, []);

  // Create lab environment
  const createLabEnvironment = (scene, shadowGenerator) => {
    // Floor with grid
    const floor = BABYLON.MeshBuilder.CreateGround(
      "floor",
      { width: 40, height: 40 },
      scene
    );
    const floorMaterial = new GridMaterial("floorMat", scene);
    floorMaterial.mainColor = new BABYLON.Color3(0.05, 0.05, 0.08);
    floorMaterial.lineColor = new BABYLON.Color3(0.12, 0.15, 0.22);
    floorMaterial.gridRatio = 1;
    floor.material = floorMaterial;
    floor.receiveShadows = true;

    // Measurement marks
    const markMat = new BABYLON.StandardMaterial("markMat", scene);
    markMat.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.8);
    markMat.alpha = 0.8;

    for (let i = -15; i <= 15; i++) {
      if (i === 0) continue;
      const isMajor = i % 5 === 0;
      const mark = BABYLON.MeshBuilder.CreateBox(
        `mark${i}`,
        {
          width: 0.03,
          height: 0.01,
          depth: isMajor ? 0.4 : 0.2,
        },
        scene
      );
      mark.position = new BABYLON.Vector3(i, 0.005, 0);
      mark.material = markMat;

      // Add number labels for major marks
      if (isMajor && i !== 0) {
        const labelPlane = BABYLON.MeshBuilder.CreatePlane(
          `label${i}`,
          { size: 0.5 },
          scene
        );
        labelPlane.position = new BABYLON.Vector3(i, 0.01, 0.5);
        labelPlane.rotation.x = Math.PI / 2;
        const labelMat = new BABYLON.StandardMaterial(`labelMat${i}`, scene);
        labelMat.emissiveColor = new BABYLON.Color3(0.5, 0.7, 1);
        labelMat.alpha = 0.8;
        labelPlane.material = labelMat;
      }
    }

    // Background
    const backWall = BABYLON.MeshBuilder.CreatePlane(
      "backWall",
      { width: 50, height: 20 },
      scene
    );
    backWall.position = new BABYLON.Vector3(0, 10, -15);
    const wallMat = new BABYLON.PBRMaterial("wallMat", scene);
    wallMat.albedoColor = new BABYLON.Color3(0.03, 0.03, 0.06);
    wallMat.metallic = 0;
    wallMat.roughness = 1;
    backWall.material = wallMat;
  };

  // Select experiment
  const handleSelectExperiment = useCallback((experiment) => {
    setSelectedExperiment(experiment);
    setShowResults(false);
    setMeasurements({});
    setSimulationTime(0);
    setAiExplanation("");
    trajectoryPointsRef.current = [];
    simulationDataRef.current = { positions: [], velocities: [], times: [] };

    // Initialize default parameters
    const defaultParams = {};
    experiment.variables.forEach((v) => {
      defaultParams[v.name] = v.default;
    });
    setExperimentParams(defaultParams);
    experimentParamsRef.current = defaultParams;

    // Clear previous objects
    clearSimulationObjects();

    // Setup new experiment
    if (sceneRef.current) {
      setupExperiment(experiment, defaultParams);
    }
  }, []);

  // Clear ALL simulation objects thoroughly
  const clearSimulationObjects = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Stop any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isSimulatingRef.current = false;

    // Dispose ALL tracked experiment meshes
    experimentMeshesRef.current.forEach((mesh) => {
      if (mesh && !mesh.isDisposed()) {
        mesh.dispose();
      }
    });
    experimentMeshesRef.current = [];

    // Also dispose specific refs
    [projectileRef, launcherRef, trajectoryMeshRef].forEach((ref) => {
      if (ref.current && !ref.current.isDisposed?.()) {
        ref.current.dispose();
      }
      ref.current = null;
    });

    // Dispose pendulum parts
    if (pendulumRef.current) {
      Object.values(pendulumRef.current).forEach((item) => {
        if (Array.isArray(item)) {
          item.forEach((m) => m?.dispose?.());
        } else if (item?.dispose) {
          item.dispose();
        }
      });
      pendulumRef.current = null;
    }

    // Dispose collision objects
    collisionObjectsRef.current.forEach((obj) => {
      if (obj.mesh && !obj.mesh.isDisposed?.()) obj.mesh.dispose();
      if (obj.ball && !obj.ball.isDisposed?.()) obj.ball.dispose();
      if (obj.string && !obj.string.isDisposed?.()) obj.string.dispose();
    });
    collisionObjectsRef.current = [];

    // Dispose particles
    if (particleSystemRef.current) {
      particleSystemRef.current.dispose();
      particleSystemRef.current = null;
    }

    // Clear trajectory points
    trajectoryPointsRef.current = [];
  };

  // Setup experiment
  const setupExperiment = (experiment, params) => {
    const scene = sceneRef.current;
    if (!scene) return;

    switch (experiment.id) {
      case "projectile_motion":
        setupProjectileMotion(scene, params);
        break;
      case "pendulum":
        setupPendulum(scene, params);
        break;
      case "collision":
        setupCollision(scene, params);
        break;
      case "inclined_plane":
        setupInclinedPlane(scene, params);
        break;
      case "spring_oscillator":
        setupSpringOscillator(scene, params);
        break;
      case "newtons_cradle":
        setupNewtonsCradle(scene, params);
        break;
      case "free_fall":
        setupFreeFall(scene, params);
        break;
      case "circular_motion":
        setupCircularMotion(scene, params);
        break;
      case "wave_motion":
        setupWaveMotion(scene, params);
        break;
      case "atwood_machine":
        setupAtwoodMachine(scene, params);
        break;
      default:
        break;
    }
  };

  // Helper to track meshes for cleanup
  const trackMesh = (mesh) => {
    if (mesh) experimentMeshesRef.current.push(mesh);
    return mesh;
  };

  // ===== ADVANCED ANIMATION HELPERS =====

  // Create particle system for impact/launch effects
  const createParticleSystem = (scene, emitterMesh, options = {}) => {
    const particleSystem = new BABYLON.ParticleSystem(
      "particles",
      options.capacity || 100,
      scene
    );
    particleSystem.particleTexture = new BABYLON.Texture(
      "https://assets.babylonjs.com/textures/flare.png",
      scene
    );
    particleSystem.emitter = emitterMesh;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, 0, -0.1);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0, 0.1);

    particleSystem.color1 =
      options.color1 || new BABYLON.Color4(1, 0.8, 0.3, 1);
    particleSystem.color2 = options.color2 || new BABYLON.Color4(1, 0.5, 0, 1);
    particleSystem.colorDead = new BABYLON.Color4(0.2, 0.1, 0, 0);

    particleSystem.minSize = options.minSize || 0.05;
    particleSystem.maxSize = options.maxSize || 0.15;
    particleSystem.minLifeTime = options.minLifeTime || 0.2;
    particleSystem.maxLifeTime = options.maxLifeTime || 0.5;
    particleSystem.emitRate = options.emitRate || 50;

    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
    particleSystem.minEmitPower = options.minPower || 0.5;
    particleSystem.maxEmitPower = options.maxPower || 1.5;
    particleSystem.updateSpeed = 0.01;

    particleSystemRef.current = particleSystem;
    return particleSystem;
  };

  // Create trail/ribbon effect for moving objects
  const createTrailMesh = (scene, name, color, maxPoints = 50) => {
    const trail = {
      points: [],
      maxPoints: maxPoints,
      mesh: null,
      color: color || new BABYLON.Color3(0.3, 0.7, 1.0),
      update: function (position) {
        this.points.push(position.clone());
        if (this.points.length > this.maxPoints) {
          this.points.shift();
        }
        if (this.mesh) {
          this.mesh.dispose();
        }
        if (this.points.length > 2) {
          this.mesh = trackMesh(
            BABYLON.MeshBuilder.CreateLines(
              name,
              { points: this.points },
              scene
            )
          );
          this.mesh.color = this.color;
        }
      },
      clear: function () {
        this.points = [];
        if (this.mesh) {
          this.mesh.dispose();
          this.mesh = null;
        }
      },
    };
    return trail;
  };

  // Create glow layer for enhanced visuals
  const createGlowLayer = (scene) => {
    const gl = new BABYLON.GlowLayer("glow", scene, {
      mainTextureFixedSize: 256,
      blurKernelSize: 64,
    });
    gl.intensity = 0.5;
    return gl;
  };

  // Create velocity arrow indicator
  const createVelocityArrow = (scene, name, color) => {
    const arrow = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        name + "_shaft",
        {
          height: 1,
          diameter: 0.05,
          tessellation: 8,
        },
        scene
      )
    );

    const arrowHead = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        name + "_head",
        {
          height: 0.2,
          diameterTop: 0,
          diameterBottom: 0.15,
          tessellation: 8,
        },
        scene
      )
    );
    arrowHead.parent = arrow;
    arrowHead.position.y = 0.6;

    const mat = new BABYLON.StandardMaterial(name + "_mat", scene);
    mat.diffuseColor = color || new BABYLON.Color3(1, 0.3, 0.3);
    mat.emissiveColor = color
      ? color.scale(0.3)
      : new BABYLON.Color3(0.3, 0.1, 0.1);
    arrow.material = mat;
    arrowHead.material = mat;

    arrow.setEnabled(false);

    return {
      mesh: arrow,
      update: function (position, velocity, scale = 0.5) {
        if (velocity.length() < 0.01) {
          this.mesh.setEnabled(false);
          return;
        }
        this.mesh.setEnabled(true);
        this.mesh.position = position.clone();
        this.mesh.scaling.y = velocity.length() * scale;

        // Point arrow in direction of velocity
        const direction = velocity.normalize();
        const angle = Math.atan2(direction.x, direction.y);
        this.mesh.rotation.z = -angle;
      },
    };
  };

  // Create momentum/energy bar indicator
  const createEnergyBar = (scene, name, position, color) => {
    const bar = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        name,
        {
          width: 0.1,
          height: 1,
          depth: 0.05,
        },
        scene
      )
    );
    bar.position = position;

    const mat = new BABYLON.StandardMaterial(name + "_mat", scene);
    mat.diffuseColor = color || new BABYLON.Color3(0.2, 0.8, 0.3);
    mat.emissiveColor = color
      ? color.scale(0.2)
      : new BABYLON.Color3(0.05, 0.2, 0.08);
    bar.material = mat;

    return {
      mesh: bar,
      maxValue: 1,
      update: function (value) {
        const normalized = Math.min(1, Math.max(0, value / this.maxValue));
        this.mesh.scaling.y = normalized;
        this.mesh.position.y = position.y - (1 - normalized) * 0.5;
      },
    };
  };

  // ============ PROJECTILE MOTION - EDUCATIONAL SETUP ============
  const setupProjectileMotion = (scene, params) => {
    const startX = -8;
    const startY = 1;
    const angle = params.angle || 45;
    const velocity = params.velocity || 15;

    // === LAUNCHER (Cannon/Launcher) ===
    const launcher = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "launcher",
        { width: 1.2, height: 0.6, depth: 1 },
        scene
      )
    );
    launcher.position = new BABYLON.Vector3(startX, 0.3, 0);
    const launcherMat = new BABYLON.StandardMaterial("launcherMat", scene);
    launcherMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    launcher.material = launcherMat;
    launcherRef.current = launcher;

    // Launcher barrel (tilted at angle)
    const barrel = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "barrel",
        { height: 1.5, diameter: 0.3 },
        scene
      )
    );
    barrel.position = new BABYLON.Vector3(0.3, 0.5, 0);
    barrel.rotation.z = -(angle * Math.PI) / 180 + Math.PI / 2;
    barrel.material = launcherMat;
    barrel.parent = launcher;

    // === PROJECTILE (Large visible ball) ===
    const ballDiameter = 0.5; // Larger for visibility
    const projectile = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "projectile",
        { diameter: ballDiameter, segments: 24 },
        scene
      )
    );
    projectile.position = new BABYLON.Vector3(startX, startY, 0);
    const projMat = new BABYLON.StandardMaterial("projMat", scene);
    projMat.diffuseColor = new BABYLON.Color3(1, 0.4, 0.1); // Bright orange
    projMat.specularColor = new BABYLON.Color3(1, 0.8, 0.5);
    projectile.material = projMat;
    projectileRef.current = projectile;

    // === VELOCITY ARROW (Shows initial velocity direction) ===
    const velocityArrow = createForceArrow(
      scene,
      "velocity",
      new BABYLON.Color3(0, 0.8, 0.2),
      velocity / 15
    );
    velocityArrow.position = new BABYLON.Vector3(startX, startY + 0.5, 0);
    velocityArrow.rotation.z = ((90 - angle) * Math.PI) / 180; // Point in velocity direction

    // === GROUND REFERENCE LINE ===
    const ground = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "ground",
        { width: 25, height: 0.05, depth: 3 },
        scene
      )
    );
    ground.position = new BABYLON.Vector3(0, 0.025, 0);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2); // Green grass
    ground.material = groundMat;

    // === DISTANCE MARKERS (Every 5 meters) ===
    const range = getProjectileRange(velocity, angle);
    for (let d = 5; d <= Math.ceil(range); d += 5) {
      const marker = trackMesh(
        BABYLON.MeshBuilder.CreateBox(
          "marker" + d,
          { width: 0.1, height: 0.3, depth: 0.5 },
          scene
        )
      );
      marker.position = new BABYLON.Vector3(startX + d, 0.15, 0);
      const markerMat = new BABYLON.StandardMaterial("markerMat" + d, scene);
      markerMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
      marker.material = markerMat;
    }

    // === TARGET ZONE (Landing spot) ===
    const target = trackMesh(
      BABYLON.MeshBuilder.CreateDisc(
        "target",
        { radius: 1, tessellation: 32 },
        scene
      )
    );
    target.position = new BABYLON.Vector3(startX + range, 0.03, 0);
    target.rotation.x = Math.PI / 2;
    const targetMat = new BABYLON.StandardMaterial("targetMat", scene);
    targetMat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 0.3);
    targetMat.alpha = 0.5;
    target.material = targetMat;

    // === HEIGHT REFERENCE (Max height indicator) ===
    const maxH = getMaxHeight(velocity, angle);
    const heightLine = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "heightLine",
        { height: maxH, diameter: 0.02 },
        scene
      )
    );
    heightLine.position = new BABYLON.Vector3(
      startX + range / 2,
      maxH / 2 + startY,
      0
    );
    const heightMat = new BABYLON.StandardMaterial("heightMat", scene);
    heightMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 1);
    heightMat.alpha = 0.6;
    heightLine.material = heightMat;

    // Store references for animation
    collisionObjectsRef.current = [{ velocityArrow, startX, startY, angle }];

    setTheoreticalValues({
      range: range,
      maxHeight: maxH,
      timeOfFlight: getTimeOfFlight(velocity, angle),
    });
  };

  // ============ PENDULUM - EDUCATIONAL SETUP ============
  const setupPendulum = (scene, params) => {
    const pivotHeight = 6;
    const length = params.length || 2; // Longer default for visibility
    const amplitude = params.amplitude || 20;
    const angleRad = (amplitude * Math.PI) / 180;

    // === SUPPORT STRUCTURE (Dark metal frame) ===
    const frame = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "frame",
        { width: 0.15, height: pivotHeight + 0.5, depth: 0.15 },
        scene
      )
    );
    frame.position = new BABYLON.Vector3(0, pivotHeight / 2, 0);
    const frameMat = new BABYLON.StandardMaterial("frameMat", scene);
    frameMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
    frame.material = frameMat;

    // === PIVOT POINT (Small silver ball) ===
    const pivot = trackMesh(
      BABYLON.MeshBuilder.CreateSphere("pivot", { diameter: 0.2 }, scene)
    );
    pivot.position = new BABYLON.Vector3(0, pivotHeight, 0);
    const pivotMat = new BABYLON.StandardMaterial("pivotMat", scene);
    pivotMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    pivot.material = pivotMat;

    // === PENDULUM BOB (Large, visible golden sphere) ===
    const bobDiameter = 0.8; // Much larger for visibility
    const bob = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "bob",
        { diameter: bobDiameter, segments: 32 },
        scene
      )
    );
    bob.position = new BABYLON.Vector3(
      length * Math.sin(angleRad),
      pivotHeight - length * Math.cos(angleRad),
      0
    );
    const bobMat = new BABYLON.StandardMaterial("bobMat", scene);
    bobMat.diffuseColor = new BABYLON.Color3(1.0, 0.8, 0.2); // Bright gold
    bobMat.specularColor = new BABYLON.Color3(1, 1, 0.5);
    bobMat.specularPower = 64;
    bob.material = bobMat;

    // === STRING (Visible rope) ===
    const string = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "string",
        { height: length, diameter: 0.05 },
        scene
      )
    );
    const stringMat = new BABYLON.StandardMaterial("stringMat", scene);
    stringMat.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4); // Brown rope color
    string.material = stringMat;
    updatePendulumString(string, pivotHeight, bob.position);

    // === EQUILIBRIUM LINE (Vertical dashed indicator) ===
    const eqLine = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "eqLine",
        { height: length + 1, diameter: 0.02 },
        scene
      )
    );
    eqLine.position = new BABYLON.Vector3(0, pivotHeight - length / 2, 0);
    const eqMat = new BABYLON.StandardMaterial("eqMat", scene);
    eqMat.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.3); // Green
    eqMat.alpha = 0.5;
    eqLine.material = eqMat;

    // === ANGLE ARC (Shows current angle) ===
    const arc = trackMesh(
      BABYLON.MeshBuilder.CreateTorus(
        "arc",
        { diameter: 1.5, thickness: 0.03, tessellation: 64 },
        scene
      )
    );
    arc.position = new BABYLON.Vector3(0, pivotHeight, 0);
    arc.rotation.x = Math.PI / 2;
    const arcMat = new BABYLON.StandardMaterial("arcMat", scene);
    arcMat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1.0); // Blue glow
    arcMat.alpha = 0.6;
    arc.material = arcMat;

    // === GRAVITY ARROW (Points down from bob) ===
    const gravityArrow = createForceArrow(
      scene,
      "gravity",
      new BABYLON.Color3(1, 0.3, 0.3),
      0.8
    );
    gravityArrow.position = bob.position.clone();
    gravityArrow.position.y -= bobDiameter / 2;
    gravityArrow.rotation.z = Math.PI; // Point down

    // === TENSION ARROW (Points along string toward pivot) ===
    const tensionArrow = createForceArrow(
      scene,
      "tension",
      new BABYLON.Color3(0.3, 0.8, 1),
      0.6
    );
    tensionArrow.position = bob.position.clone();

    // Store all parts for animation
    pendulumRef.current = {
      frame,
      pivot,
      bob,
      string,
      arc,
      eqLine,
      gravityArrow,
      tensionArrow,
      length,
      pivotHeight,
      bobDiameter,
    };

    setTheoreticalValues({
      period: pendulumPeriod(length),
      frequency: 1 / pendulumPeriod(length),
    });
  };

  // Helper: Create a force arrow (shaft + head)
  const createForceArrow = (scene, name, color, size = 1) => {
    // Arrow shaft
    const shaft = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        name + "_shaft",
        { height: size * 0.8, diameter: 0.06 },
        scene
      )
    );
    shaft.position.y = -size * 0.4;

    // Arrow head (cone)
    const head = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        name + "_head",
        {
          height: size * 0.3,
          diameterTop: 0,
          diameterBottom: 0.18,
        },
        scene
      )
    );
    head.position.y = -size * 0.8;
    head.parent = shaft;

    // Material
    const mat = new BABYLON.StandardMaterial(name + "_mat", scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(0.3);
    shaft.material = mat;
    head.material = mat;

    return shaft;
  };

  // Helper to update pendulum string
  const updatePendulumString = (string, pivotHeight, bobPos) => {
    const dx = bobPos.x;
    const dy = pivotHeight - bobPos.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    string.scaling.y = length;
    string.position.x = bobPos.x / 2;
    string.position.y = (pivotHeight + bobPos.y) / 2;
    string.rotation.z = -Math.atan2(dx, dy);
  };

  // Setup collision
  // ============ ELASTIC COLLISION - EDUCATIONAL SETUP ============
  const setupCollision = (scene, params) => {
    // === TRACK (Long horizontal surface) ===
    const track = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "track",
        { width: 14, height: 0.08, depth: 1.5 },
        scene
      )
    );
    track.position = new BABYLON.Vector3(0, 0.04, 0);
    const trackMat = new BABYLON.StandardMaterial("trackMat", scene);
    trackMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
    track.material = trackMat;

    // === BALL 1 (Blue - moving right) ===
    const size1 = 0.5 + params.mass1 * 0.08; // Larger balls
    const obj1 = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "obj1",
        { diameter: size1, segments: 24 },
        scene
      )
    );
    obj1.position = new BABYLON.Vector3(-5, size1 / 2 + 0.08, 0);
    const mat1 = new BABYLON.StandardMaterial("mat1", scene);
    mat1.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1); // Bright blue
    mat1.specularColor = new BABYLON.Color3(0.5, 0.7, 1);
    obj1.material = mat1;

    // === VELOCITY ARROW 1 (Shows velocity direction) ===
    const v1Arrow = createForceArrow(
      scene,
      "v1",
      new BABYLON.Color3(0.2, 0.5, 1),
      Math.abs(params.velocity1) / 6
    );
    v1Arrow.position = new BABYLON.Vector3(-5, size1 + 0.5, 0);
    v1Arrow.rotation.z = params.velocity1 >= 0 ? Math.PI / 2 : -Math.PI / 2; // Point left or right

    // === BALL 2 (Red/Orange - moving left) ===
    const size2 = 0.5 + params.mass2 * 0.08;
    const obj2 = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "obj2",
        { diameter: size2, segments: 24 },
        scene
      )
    );
    obj2.position = new BABYLON.Vector3(5, size2 / 2 + 0.08, 0);
    const mat2 = new BABYLON.StandardMaterial("mat2", scene);
    mat2.diffuseColor = new BABYLON.Color3(1, 0.4, 0.2); // Bright orange
    mat2.specularColor = new BABYLON.Color3(1, 0.7, 0.5);
    obj2.material = mat2;

    // === VELOCITY ARROW 2 ===
    const v2Arrow = createForceArrow(
      scene,
      "v2",
      new BABYLON.Color3(1, 0.4, 0.2),
      Math.abs(params.velocity2) / 6
    );
    v2Arrow.position = new BABYLON.Vector3(5, size2 + 0.5, 0);
    v2Arrow.rotation.z = params.velocity2 >= 0 ? Math.PI / 2 : -Math.PI / 2;

    // === COLLISION POINT INDICATOR (Center marker) ===
    const collisionMarker = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "collisionMarker",
        { height: 0.02, diameter: 0.5 },
        scene
      )
    );
    collisionMarker.position = new BABYLON.Vector3(0, 0.09, 0);
    collisionMarker.rotation.x = Math.PI / 2;
    const markerMat = new BABYLON.StandardMaterial("markerMat", scene);
    markerMat.emissiveColor = new BABYLON.Color3(1, 1, 0.3);
    markerMat.alpha = 0.5;
    collisionMarker.material = markerMat;

    // === MOMENTUM BARS (Visual indicators) ===
    const bar1 = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "momentum1",
        { width: 0.2, height: 1, depth: 0.15 },
        scene
      )
    );
    bar1.position = new BABYLON.Vector3(-6.5, 0.5, 0);
    const bar1Mat = new BABYLON.StandardMaterial("bar1Mat", scene);
    bar1Mat.emissiveColor = new BABYLON.Color3(0.2, 0.5, 1);
    bar1Mat.alpha = 0.8;
    bar1.material = bar1Mat;
    bar1.scaling.y = Math.abs(params.velocity1 * params.mass1) / 10;

    const bar2 = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "momentum2",
        { width: 0.2, height: 1, depth: 0.15 },
        scene
      )
    );
    bar2.position = new BABYLON.Vector3(6.5, 0.5, 0);
    const bar2Mat = new BABYLON.StandardMaterial("bar2Mat", scene);
    bar2Mat.emissiveColor = new BABYLON.Color3(1, 0.4, 0.2);
    bar2Mat.alpha = 0.8;
    bar2.material = bar2Mat;
    bar2.scaling.y = Math.abs(params.velocity2 * params.mass2) / 10;

    // Store references for animation
    collisionObjectsRef.current = [
      {
        mesh: obj1,
        mass: params.mass1,
        velocity: params.velocity1,
        initialX: -5,
        bar: bar1,
        arrow: v1Arrow,
        size: size1,
      },
      {
        mesh: obj2,
        mass: params.mass2,
        velocity: params.velocity2,
        initialX: 5,
        bar: bar2,
        arrow: v2Arrow,
        size: size2,
      },
      { mesh: track, marker: collisionMarker },
    ];

    const result = elasticCollision(
      params.mass1,
      params.velocity1,
      params.mass2,
      params.velocity2
    );
    setTheoreticalValues({
      v1_final: result.v1f,
      v2_final: result.v2f,
      momentum_before:
        params.mass1 * params.velocity1 + params.mass2 * params.velocity2,
      momentum_after: params.mass1 * result.v1f + params.mass2 * result.v2f,
    });
  };

  // Setup inclined plane - ball rolls LEFT to RIGHT (X-axis) - Fixed with trackMesh
  // ============ INCLINED PLANE - EDUCATIONAL SETUP ============
  const setupInclinedPlane = (scene, params) => {
    const angle = params.angle || 30;
    const angleRad = (angle * Math.PI) / 180;
    const planeLength = 8; // Longer for better visibility
    const planeHeight = planeLength * Math.sin(angleRad);
    const planeWidth = planeLength * Math.cos(angleRad);
    const friction = params.friction || 0;

    // === INCLINED PLANE (Ramp) ===
    const plane = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "inclined",
        { width: planeLength, height: 0.15, depth: 2.5 },
        scene
      )
    );
    plane.rotation.z = angleRad;
    plane.position = new BABYLON.Vector3(0, planeHeight / 2, 0);
    const planeMat = new BABYLON.StandardMaterial("planeMat", scene);
    planeMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
    plane.material = planeMat;

    // === GROUND REFERENCE ===
    const ground = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "ground",
        { width: 12, height: 0.05, depth: 3 },
        scene
      )
    );
    ground.position = new BABYLON.Vector3(0, 0.025, 0);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.25, 0.4, 0.25);
    ground.material = groundMat;

    // === BALL (Large, visible) ===
    const ballRadius = 0.35;
    const ball = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "ball",
        { diameter: ballRadius * 2, segments: 24 },
        scene
      )
    );
    const startX = -planeWidth / 2 + ballRadius;
    const startY = planeHeight + ballRadius + 0.1;
    ball.position = new BABYLON.Vector3(startX, startY, 0);
    const ballMat = new BABYLON.StandardMaterial("ballMat", scene);
    ballMat.diffuseColor = new BABYLON.Color3(0.3, 0.9, 0.4); // Bright green
    ballMat.specularColor = new BABYLON.Color3(0.5, 1, 0.6);
    ball.material = ballMat;

    // === FORCE ARROWS ===
    // Weight (mg) - points straight down
    const weightArrow = createForceArrow(
      scene,
      "weight",
      new BABYLON.Color3(1, 0.3, 0.3),
      1.0
    );
    weightArrow.position = ball.position.clone();
    weightArrow.rotation.z = Math.PI; // Points down

    // Weight component parallel to plane (mg sin θ) - points down the slope
    const parallelArrow = createForceArrow(
      scene,
      "parallel",
      new BABYLON.Color3(1, 0.8, 0.2),
      0.7
    );
    parallelArrow.position = ball.position.clone();
    parallelArrow.rotation.z = Math.PI / 2 + angleRad; // Along the slope

    // Normal force (N) - perpendicular to plane surface
    const normalArrow = createForceArrow(
      scene,
      "normal",
      new BABYLON.Color3(0.3, 0.8, 1),
      0.6
    );
    normalArrow.position = ball.position.clone();
    normalArrow.rotation.z = angleRad; // Perpendicular to slope

    // Friction arrow (if friction > 0) - opposes motion, points up the slope
    let frictionArrow = null;
    if (friction > 0) {
      frictionArrow = createForceArrow(
        scene,
        "friction",
        new BABYLON.Color3(1, 0.5, 0.8),
        friction * 0.8
      );
      frictionArrow.position = ball.position.clone();
      frictionArrow.rotation.z = -Math.PI / 2 + angleRad; // Up the slope
    }

    // === ANGLE INDICATOR ARC ===
    const angleArc = trackMesh(
      BABYLON.MeshBuilder.CreateTorus(
        "angleArc",
        { diameter: 1.5, thickness: 0.03, tessellation: 32 },
        scene
      )
    );
    angleArc.position = new BABYLON.Vector3(-planeWidth / 2, 0.1, 0);
    angleArc.rotation.x = Math.PI / 2;
    const arcMat = new BABYLON.StandardMaterial("arcMat", scene);
    arcMat.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.3);
    arcMat.alpha = 0.6;
    angleArc.material = arcMat;

    // Store references
    projectileRef.current = ball;
    collisionObjectsRef.current = [
      {
        mesh: plane,
        angle: angleRad,
        length: planeLength,
        height: planeHeight,
        width: planeWidth,
        friction: friction,
        startX: startX,
        startY: startY,
        ballRadius: ballRadius,
        weightArrow,
        parallelArrow,
        normalArrow,
        frictionArrow,
      },
    ];

    // Calculate theoretical values
    const g = 9.81;
    const a = g * (Math.sin(angleRad) - friction * Math.cos(angleRad));
    setTheoreticalValues({
      acceleration: Math.max(0, a),
      finalVelocity: Math.sqrt(2 * Math.max(0, a) * planeLength),
      timeToBottom: a > 0 ? Math.sqrt((2 * planeLength) / a) : Infinity,
    });
  };

  // Setup spring oscillator
  // ============ SPRING OSCILLATOR - EDUCATIONAL SETUP ============
  const setupSpringOscillator = (scene, params) => {
    const springHeight = 6;
    const equilibriumY = springHeight - 2;
    const amplitude = params.amplitude || 0.3;
    const k = params.springConstant || 50;
    const m = params.mass || 1;

    // === SUPPORT BEAM ===
    const support = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "support",
        { width: 2, height: 0.2, depth: 1 },
        scene
      )
    );
    support.position = new BABYLON.Vector3(0, springHeight, 0);
    const supportMat = new BABYLON.StandardMaterial("supportMat", scene);
    supportMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    support.material = supportMat;

    // === SPRING COILS (Visual helix) ===
    const springCoils = [];
    const numCoils = 10;
    for (let i = 0; i < numCoils; i++) {
      const coil = trackMesh(
        BABYLON.MeshBuilder.CreateTorus(
          `coil${i}`,
          { diameter: 0.4, thickness: 0.04, tessellation: 24 },
          scene
        )
      );
      coil.rotation.x = Math.PI / 2;
      coil.position.y = springHeight - 0.3 - i * 0.18;
      const coilMat = new BABYLON.StandardMaterial(`coilMat${i}`, scene);
      coilMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.65);
      coilMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
      coil.material = coilMat;
      springCoils.push(coil);
    }

    // === MASS BLOCK (Large, visible) ===
    const mass = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "mass",
        { width: 0.8, height: 0.6, depth: 0.8 },
        scene
      )
    );
    mass.position = new BABYLON.Vector3(0, equilibriumY - amplitude, 0);
    const massMat = new BABYLON.StandardMaterial("massMat", scene);
    massMat.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.6); // Bright magenta
    massMat.specularColor = new BABYLON.Color3(1, 0.5, 0.8);
    mass.material = massMat;

    // === EQUILIBRIUM LINE (Reference) ===
    const eqLine = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "eqLine",
        { width: 3, height: 0.02, depth: 0.5 },
        scene
      )
    );
    eqLine.position = new BABYLON.Vector3(0, equilibriumY, 0);
    const eqMat = new BABYLON.StandardMaterial("eqMat", scene);
    eqMat.emissiveColor = new BABYLON.Color3(0.3, 0.8, 0.3);
    eqMat.alpha = 0.6;
    eqLine.material = eqMat;

    // === SPRING FORCE ARROW (F = -kx, points toward equilibrium) ===
    const springArrow = createForceArrow(
      scene,
      "spring",
      new BABYLON.Color3(0.2, 0.8, 1),
      0.6
    );
    springArrow.position = new BABYLON.Vector3(
      0.8,
      equilibriumY - amplitude,
      0
    );
    springArrow.rotation.z = 0; // Will update during animation

    // === GRAVITY ARROW (Constant, points down) ===
    const gravityArrow = createForceArrow(
      scene,
      "gravity",
      new BABYLON.Color3(1, 0.3, 0.3),
      0.5
    );
    gravityArrow.position = new BABYLON.Vector3(
      -0.8,
      equilibriumY - amplitude - 0.5,
      0
    );
    gravityArrow.rotation.z = Math.PI; // Points down

    // Store references
    projectileRef.current = mass;
    pendulumRef.current = {
      springCoils,
      equilibriumY,
      springHeight,
      springArrow,
      gravityArrow,
      k,
      m,
    };

    setTheoreticalValues({
      period: springPeriod(m, k),
      frequency: 1 / springPeriod(m, k),
      maxVelocity: amplitude * Math.sqrt(k / m),
    });
  };

  // Setup Newton's cradle
  const setupNewtonsCradle = (scene, params) => {
    const numBalls = Math.round(params.balls || 5);
    const ballDiameter = 0.4;
    const stringLength = 2.5;
    const baseY = 5;

    // Frame
    const frameMat = new BABYLON.PBRMaterial("frameMat", scene);
    frameMat.albedoColor = new BABYLON.Color3(0.25, 0.25, 0.3);
    frameMat.metallic = 0.85;

    const topBar = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "topBar",
        {
          width: numBalls * ballDiameter + 1,
          height: 0.1,
          depth: 0.1,
        },
        scene
      )
    );
    topBar.position = new BABYLON.Vector3(0, baseY, 0);
    topBar.material = frameMat;

    // Side supports
    const leftSupport = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "leftSupport",
        { width: 0.1, height: baseY, depth: 0.1 },
        scene
      )
    );
    leftSupport.position = new BABYLON.Vector3(
      -(numBalls * ballDiameter) / 2 - 0.4,
      baseY / 2,
      0
    );
    leftSupport.material = frameMat;

    const rightSupport = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "rightSupport",
        { width: 0.1, height: baseY, depth: 0.1 },
        scene
      )
    );
    rightSupport.position = new BABYLON.Vector3(
      (numBalls * ballDiameter) / 2 + 0.4,
      baseY / 2,
      0
    );
    rightSupport.material = frameMat;

    // Balls - store separately in pendulumRef for animation
    const ballsData = [];
    const startX = -((numBalls - 1) * ballDiameter) / 2;

    for (let i = 0; i < numBalls; i++) {
      const ball = trackMesh(
        BABYLON.MeshBuilder.CreateSphere(
          `cradleBall${i}`,
          { diameter: ballDiameter, segments: 16 },
          scene
        )
      );
      const x = startX + i * ballDiameter;
      ball.position = new BABYLON.Vector3(
        x,
        baseY - stringLength - ballDiameter / 2,
        0
      );

      const ballMat = new BABYLON.PBRMaterial(`cradleBallMat${i}`, scene);
      ballMat.albedoColor = new BABYLON.Color3(0.9, 0.9, 0.95);
      ballMat.metallic = 0.98;
      ballMat.roughness = 0.02;
      ball.material = ballMat;

      const string = trackMesh(
        BABYLON.MeshBuilder.CreateCylinder(
          `cradleString${i}`,
          {
            height: stringLength,
            diameter: 0.02,
          },
          scene
        )
      );
      string.position = new BABYLON.Vector3(x, baseY - stringLength / 2, 0);
      string.material = frameMat;

      ballsData.push({ ball, string, x, baseY, stringLength });
    }

    // Store balls data in pendulumRef for easy access in animation
    pendulumRef.current = { ballsData, baseY, stringLength };
    collisionObjectsRef.current = [{ mesh: topBar }];

    setTheoreticalValues({
      momentum_conserved: "Yes",
      energy_conserved: "Yes",
      balls_in_motion: Math.round(params.pullBack),
    });
  };

  // ============ FREE FALL - EDUCATIONAL SETUP ============
  const setupFreeFall = (scene, params) => {
    const height = params.height || 12;

    // === PLATFORM (Drop point) ===
    const platform = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "platform",
        { width: 2.5, height: 0.25, depth: 2 },
        scene
      )
    );
    platform.position = new BABYLON.Vector3(0, height, 0);
    const platformMat = new BABYLON.StandardMaterial("platformMat", scene);
    platformMat.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.4);
    platform.material = platformMat;

    // === SUPPORT PILLAR ===
    const pillar = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "pillar",
        { width: 0.4, height: height, depth: 0.4 },
        scene
      )
    );
    pillar.position = new BABYLON.Vector3(-1, height / 2, 0);
    pillar.material = platformMat;

    // === FALLING BALL (Large, visible) ===
    const ballDiameter = 0.7;
    const ball = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "fallingBall",
        { diameter: ballDiameter, segments: 24 },
        scene
      )
    );
    ball.position = new BABYLON.Vector3(0, height - 0.5, 0);
    const ballMat = new BABYLON.StandardMaterial("fallingBallMat", scene);
    ballMat.diffuseColor = new BABYLON.Color3(1, 0.35, 0.25); // Bright red-orange
    ballMat.specularColor = new BABYLON.Color3(1, 0.6, 0.5);
    ball.material = ballMat;

    // === HEIGHT MARKERS (Every 2 meters) ===
    for (let h = 2; h < height; h += 2) {
      const marker = trackMesh(
        BABYLON.MeshBuilder.CreateBox(
          "heightMarker" + h,
          { width: 0.8, height: 0.05, depth: 0.3 },
          scene
        )
      );
      marker.position = new BABYLON.Vector3(1.2, h, 0);
      const markerMat = new BABYLON.StandardMaterial("markerMat" + h, scene);
      markerMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
      marker.material = markerMat;
    }

    // === GROUND TARGET ===
    const ground = trackMesh(
      BABYLON.MeshBuilder.CreateDisc(
        "groundTarget",
        { radius: 1.8, tessellation: 32 },
        scene
      )
    );
    ground.position = new BABYLON.Vector3(0, 0.02, 0);
    ground.rotation.x = Math.PI / 2;
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 0.2);
    groundMat.alpha = 0.5;
    ground.material = groundMat;

    // === GRAVITY ARROW (Constant force pointing down) ===
    const gravityArrow = createForceArrow(
      scene,
      "gravity",
      new BABYLON.Color3(1, 0.3, 0.3),
      1.0
    );
    gravityArrow.position = new BABYLON.Vector3(0, height - 1.5, 0);
    gravityArrow.rotation.z = Math.PI; // Points down

    // === VELOCITY ARROW (Will grow during fall) ===
    const velocityArrow = createForceArrow(
      scene,
      "velocity",
      new BABYLON.Color3(0.3, 0.8, 0.3),
      0.3
    );
    velocityArrow.position = new BABYLON.Vector3(0, height - 2, 0);
    velocityArrow.rotation.z = Math.PI; // Points down

    // Store references
    projectileRef.current = ball;
    pendulumRef.current = {
      startHeight: height - 0.5,
      gravityArrow,
      velocityArrow,
      ballDiameter,
    };

    const g = 9.81;
    setTheoreticalValues({
      final_velocity: Math.sqrt(2 * g * height).toFixed(2) + " m/s",
      fall_time: Math.sqrt((2 * height) / g).toFixed(2) + " s",
      impact_energy:
        (0.5 * (params.mass || 1) * 2 * g * height).toFixed(2) + " J",
    });
  };

  // Setup Circular Motion
  // ============ CIRCULAR MOTION - EDUCATIONAL SETUP ============
  const setupCircularMotion = (scene, params) => {
    const radius = params.radius || 2;
    const centerY = 3;

    // === CENTRAL PIVOT ===
    const pivot = trackMesh(
      BABYLON.MeshBuilder.CreateSphere("pivot", { diameter: 0.4 }, scene)
    );
    pivot.position = new BABYLON.Vector3(0, centerY, 0);
    const pivotMat = new BABYLON.StandardMaterial("pivotMat", scene);
    pivotMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
    pivot.material = pivotMat;

    // === ORBITING BALL (Larger, visible) ===
    const ballDiameter = 0.6;
    const orb = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "orbitingBall",
        { diameter: ballDiameter, segments: 24 },
        scene
      )
    );
    orb.position = new BABYLON.Vector3(radius, centerY, 0);
    const orbMat = new BABYLON.StandardMaterial("orbMat", scene);
    orbMat.diffuseColor = new BABYLON.Color3(0.2, 0.7, 1.0); // Bright cyan
    orbMat.specularColor = new BABYLON.Color3(0.5, 0.8, 1);
    orb.material = orbMat;

    // === CONNECTING ROD ===
    const rod = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "rod",
        { height: radius, diameter: 0.08 },
        scene
      )
    );
    rod.position = new BABYLON.Vector3(radius / 2, centerY, 0);
    rod.rotation.z = Math.PI / 2;
    const rodMat = new BABYLON.StandardMaterial("rodMat", scene);
    rodMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    rod.material = rodMat;

    // === ORBIT PATH (Visible circle) ===
    const orbitPath = trackMesh(
      BABYLON.MeshBuilder.CreateTorus(
        "orbitPath",
        { diameter: radius * 2, thickness: 0.03, tessellation: 64 },
        scene
      )
    );
    orbitPath.position = new BABYLON.Vector3(0, centerY, 0);
    orbitPath.rotation.x = Math.PI / 2;
    const pathMat = new BABYLON.StandardMaterial("pathMat", scene);
    pathMat.emissiveColor = new BABYLON.Color3(0.2, 0.5, 0.2);
    pathMat.alpha = 0.6;
    orbitPath.material = pathMat;

    // === CENTRIPETAL FORCE ARROW (Red, points toward center) ===
    const centripetalArrow = createForceArrow(
      scene,
      "centripetal",
      new BABYLON.Color3(1, 0.3, 0.3),
      0.8
    );
    centripetalArrow.position = new BABYLON.Vector3(radius - 0.4, centerY, 0);
    centripetalArrow.rotation.z = Math.PI / 2; // Points toward center (left)

    // === VELOCITY ARROW (Green, tangent to motion) ===
    const velocityArrow = createForceArrow(
      scene,
      "velocity",
      new BABYLON.Color3(0.3, 1, 0.3),
      0.6
    );
    velocityArrow.position = new BABYLON.Vector3(radius, centerY + 0.5, 0);
    velocityArrow.rotation.z = 0; // Points up initially (tangent)

    // Store references
    projectileRef.current = orb;
    pendulumRef.current = {
      pivot,
      rod,
      radius,
      centerY,
      centripetalArrow,
      velocityArrow,
      ballDiameter,
    };

    const v = params.speed;
    const period = (2 * Math.PI * radius) / v;
    setTheoreticalValues({
      centripetal_accel: ((v * v) / radius).toFixed(2) + " m/s²",
      centripetal_force: ((params.mass * v * v) / radius).toFixed(2) + " N",
      period: period.toFixed(2) + " s",
      angular_velocity: (v / radius).toFixed(2) + " rad/s",
    });
  };

  // Setup Wave Motion
  // ============ WAVE MOTION - EDUCATIONAL SETUP ============
  const setupWaveMotion = (scene, params) => {
    const amplitude = params.amplitude || 0.5;
    const wavelength = params.wavelength || 2;
    const numPoints = 100;
    const waveLength = 15;
    const baseY = 2;

    // Create wave points
    const wavePoints = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * waveLength - waveLength / 2;
      wavePoints.push(new BABYLON.Vector3(x, baseY, 0));
    }

    // === WAVE LINE (Thicker, more visible) ===
    const waveLine = trackMesh(
      BABYLON.MeshBuilder.CreateLines(
        "waveLine",
        { points: wavePoints, updatable: true },
        scene
      )
    );
    waveLine.color = new BABYLON.Color3(0.3, 0.8, 1.0); // Bright cyan

    // === EQUILIBRIUM LINE (Horizontal reference) ===
    const eqLine = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "waveEqLine",
        { width: waveLength + 2, height: 0.02, depth: 0.3 },
        scene
      )
    );
    eqLine.position = new BABYLON.Vector3(0, baseY, 0);
    const eqMat = new BABYLON.StandardMaterial("waveEqMat", scene);
    eqMat.emissiveColor = new BABYLON.Color3(0.3, 0.6, 0.3);
    eqMat.alpha = 0.5;
    eqLine.material = eqMat;

    // === AMPLITUDE MARKERS (Top and bottom lines) ===
    const ampTopLine = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "ampTop",
        { width: waveLength + 2, height: 0.01, depth: 0.2 },
        scene
      )
    );
    ampTopLine.position = new BABYLON.Vector3(0, baseY + amplitude, 0);
    const ampMat = new BABYLON.StandardMaterial("ampMat", scene);
    ampMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0.2);
    ampMat.alpha = 0.4;
    ampTopLine.material = ampMat;

    const ampBotLine = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "ampBot",
        { width: waveLength + 2, height: 0.01, depth: 0.2 },
        scene
      )
    );
    ampBotLine.position = new BABYLON.Vector3(0, baseY - amplitude, 0);
    ampBotLine.material = ampMat;

    // === WAVELENGTH MARKERS (Vertical lines every wavelength) ===
    for (let i = -3; i <= 3; i++) {
      const marker = trackMesh(
        BABYLON.MeshBuilder.CreateBox(
          "wlMarker" + i,
          { width: 0.03, height: amplitude * 2 + 0.5, depth: 0.2 },
          scene
        )
      );
      marker.position = new BABYLON.Vector3(i * wavelength, baseY, 0);
      const markerMat = new BABYLON.StandardMaterial("wlMat" + i, scene);
      markerMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
      markerMat.alpha = 0.5;
      marker.material = markerMat;
    }

    // === PARTICLE MARKER (Shows wave motion - larger) ===
    const particle = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "waveParticle",
        { diameter: 0.4, segments: 16 },
        scene
      )
    );
    particle.position = new BABYLON.Vector3(0, baseY, 0);
    const particleMat = new BABYLON.StandardMaterial("particleMat", scene);
    particleMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0.2); // Bright orange
    particleMat.emissiveColor = new BABYLON.Color3(0.4, 0.15, 0.05);
    particle.material = particleMat;

    pendulumRef.current = {
      waveLine,
      wavePoints,
      particle,
      numPoints,
      waveLength,
      amplitude,
      wavelength,
      baseY,
    };

    const v = params.frequency * wavelength;
    setTheoreticalValues({
      wave_speed: v.toFixed(2) + " m/s",
      angular_freq: (2 * Math.PI * params.frequency).toFixed(2) + " rad/s",
      wave_number: ((2 * Math.PI) / wavelength).toFixed(2) + " rad/m",
    });
  };

  // ============ ATWOOD MACHINE - EDUCATIONAL SETUP ============
  const setupAtwoodMachine = (scene, params) => {
    const pulleyY = 6;
    const stringLength = 4;
    const m1 = params.mass1 || 5;
    const m2 = params.mass2 || 3;

    // === PULLEY (Large, visible) ===
    const pulley = trackMesh(
      BABYLON.MeshBuilder.CreateTorus(
        "pulley",
        { diameter: 1.0, thickness: 0.12, tessellation: 32 },
        scene
      )
    );
    pulley.position = new BABYLON.Vector3(0, pulleyY, 0);
    pulley.rotation.x = Math.PI / 2;
    const pulleyMat = new BABYLON.StandardMaterial("pulleyMat", scene);
    pulleyMat.diffuseColor = new BABYLON.Color3(0.45, 0.45, 0.5);
    pulley.material = pulleyMat;

    // === PULLEY AXLE ===
    const axle = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "axle",
        { height: 0.4, diameter: 0.2 },
        scene
      )
    );
    axle.position = new BABYLON.Vector3(0, pulleyY, 0);
    axle.rotation.x = Math.PI / 2;
    axle.material = pulleyMat;

    // === SUPPORT FRAME ===
    const support = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "support",
        { width: 0.2, height: pulleyY + 0.5, depth: 0.2 },
        scene
      )
    );
    support.position = new BABYLON.Vector3(0, (pulleyY + 0.5) / 2, -0.4);
    support.material = pulleyMat;

    // === MASS 1 (Heavier - left, larger cube) ===
    const size1 = 0.4 + m1 * 0.04;
    const mass1 = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "mass1",
        { width: size1, height: size1, depth: size1 },
        scene
      )
    );
    const y1 = pulleyY - stringLength / 2 - 0.5;
    mass1.position = new BABYLON.Vector3(-0.5, y1, 0);
    const mass1Mat = new BABYLON.StandardMaterial("mass1Mat", scene);
    mass1Mat.diffuseColor = new BABYLON.Color3(0.9, 0.35, 0.35); // Red
    mass1Mat.specularColor = new BABYLON.Color3(1, 0.5, 0.5);
    mass1.material = mass1Mat;

    // === MASS 2 (Lighter - right, smaller cube) ===
    const size2 = 0.4 + m2 * 0.04;
    const mass2 = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "mass2",
        { width: size2, height: size2, depth: size2 },
        scene
      )
    );
    const y2 = pulleyY - stringLength / 2 + 0.5;
    mass2.position = new BABYLON.Vector3(0.5, y2, 0);
    const mass2Mat = new BABYLON.StandardMaterial("mass2Mat", scene);
    mass2Mat.diffuseColor = new BABYLON.Color3(0.35, 0.55, 0.9); // Blue
    mass2Mat.specularColor = new BABYLON.Color3(0.5, 0.7, 1);
    mass2.material = mass2Mat;

    // === STRINGS ===
    const string1 = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "string1",
        { height: stringLength / 2 + 0.5, diameter: 0.03 },
        scene
      )
    );
    string1.position = new BABYLON.Vector3(
      -0.5,
      pulleyY - stringLength / 4 - 0.25,
      0
    );
    const stringMat = new BABYLON.StandardMaterial("stringMat", scene);
    stringMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    string1.material = stringMat;

    const string2 = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "string2",
        { height: stringLength / 2 - 0.5, diameter: 0.03 },
        scene
      )
    );
    string2.position = new BABYLON.Vector3(
      0.5,
      pulleyY - stringLength / 4 + 0.25,
      0
    );
    string2.material = stringMat;

    // === WEIGHT ARROWS (Red, pointing down from each mass) ===
    const weight1Arrow = createForceArrow(
      scene,
      "weight1",
      new BABYLON.Color3(1, 0.3, 0.3),
      0.7
    );
    weight1Arrow.position = new BABYLON.Vector3(-0.5, y1 - size1 / 2 - 0.5, 0);
    weight1Arrow.rotation.z = Math.PI; // Down
    weight1Arrow.scaling.y = m1 / 5; // Scale by mass

    const weight2Arrow = createForceArrow(
      scene,
      "weight2",
      new BABYLON.Color3(1, 0.3, 0.3),
      0.5
    );
    weight2Arrow.position = new BABYLON.Vector3(0.5, y2 - size2 / 2 - 0.4, 0);
    weight2Arrow.rotation.z = Math.PI; // Down
    weight2Arrow.scaling.y = m2 / 5; // Scale by mass

    // === TENSION ARROWS (Blue, pointing up from each mass) ===
    const tension1Arrow = createForceArrow(
      scene,
      "tension1",
      new BABYLON.Color3(0.3, 0.7, 1),
      0.5
    );
    tension1Arrow.position = new BABYLON.Vector3(-0.5, y1 + size1 / 2 + 0.4, 0);
    tension1Arrow.rotation.z = 0; // Up

    const tension2Arrow = createForceArrow(
      scene,
      "tension2",
      new BABYLON.Color3(0.3, 0.7, 1),
      0.5
    );
    tension2Arrow.position = new BABYLON.Vector3(0.5, y2 + size2 / 2 + 0.4, 0);
    tension2Arrow.rotation.z = 0; // Up

    // Store references
    projectileRef.current = mass1;
    collisionObjectsRef.current = [{ mesh: mass2 }];
    pendulumRef.current = {
      mass1,
      mass2,
      string1,
      string2,
      pulley,
      pulleyY,
      stringLength,
      initialY1: y1,
      initialY2: y2,
      size1,
      size2,
      weight1Arrow,
      weight2Arrow,
      tension1Arrow,
      tension2Arrow,
    };

    const g = 9.81;
    const a = ((m1 - m2) * g) / (m1 + m2);
    const T = (2 * m1 * m2 * g) / (m1 + m2);
    setTheoreticalValues({
      acceleration: a.toFixed(3) + " m/s²",
      tension: T.toFixed(2) + " N",
      mass_ratio: (m1 / m2).toFixed(2),
    });
  };

  // Parameter change handler with debounce to prevent rapid mesh recreation
  const handleParamChange = (paramName, value) => {
    const newParams = { ...experimentParams, [paramName]: parseFloat(value) };
    setExperimentParams(newParams);
    experimentParamsRef.current = newParams;

    // Only update visuals if not simulating - with debounce
    if (selectedExperiment && sceneRef.current && !isSimulating) {
      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the mesh recreation to avoid rapid updates
      debounceTimerRef.current = setTimeout(() => {
        clearSimulationObjects();
        setupExperiment(selectedExperiment, newParams);

        // Update theoretical values immediately
        updateTheoreticalValues(selectedExperiment, newParams);
      }, 150); // 150ms debounce
    }
  };

  // Update theoretical values based on experiment and params
  const updateTheoreticalValues = (experiment, params) => {
    switch (experiment.id) {
      case "projectile_motion":
        setTheoreticalValues({
          range: getProjectileRange(params.velocity, params.angle),
          maxHeight: getMaxHeight(params.velocity, params.angle),
          timeOfFlight: getTimeOfFlight(params.velocity, params.angle),
        });
        break;
      case "pendulum":
        setTheoreticalValues({
          period: pendulumPeriod(params.length),
          frequency: 1 / pendulumPeriod(params.length),
        });
        break;
      case "collision":
        const result = elasticCollision(
          params.mass1,
          params.velocity1,
          params.mass2,
          params.velocity2
        );
        setTheoreticalValues({
          v1_final: result.v1f,
          v2_final: result.v2f,
          momentum:
            params.mass1 * params.velocity1 + params.mass2 * params.velocity2,
        });
        break;
      case "inclined_plane":
        const a = inclinedPlaneAcceleration(params.angle);
        setTheoreticalValues({
          acceleration: a,
          finalVelocity: Math.sqrt(2 * a * 6),
        });
        break;
      case "spring_oscillator":
        setTheoreticalValues({
          period: springPeriod(params.mass, params.springConstant),
          frequency: 1 / springPeriod(params.mass, params.springConstant),
        });
        break;
      default:
        break;
    }
  };

  // RUN SIMULATION - Main animation loop
  const runSimulation = useCallback(() => {
    if (!selectedExperiment || isSimulatingRef.current) return;

    isSimulatingRef.current = true;
    setIsSimulating(true);
    setSimulationTime(0);
    setShowResults(false);
    trajectoryPointsRef.current = [];
    simulationDataRef.current = { positions: [], velocities: [], times: [] };
    startTimeRef.current = performance.now();

    // Clear old trajectory
    if (trajectoryMeshRef.current) {
      trajectoryMeshRef.current.dispose();
      trajectoryMeshRef.current = null;
    }

    const animate = () => {
      if (!isSimulatingRef.current) return;

      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      setSimulationTime(elapsed);

      let continueSimulation = true;
      const params = experimentParamsRef.current;

      switch (selectedExperiment.id) {
        case "projectile_motion":
          continueSimulation = animateProjectile(elapsed, params);
          break;
        case "pendulum":
          continueSimulation = animatePendulum(elapsed, params);
          break;
        case "collision":
          continueSimulation = animateCollision(elapsed, params);
          break;
        case "inclined_plane":
          continueSimulation = animateInclinedPlane(elapsed, params);
          break;
        case "spring_oscillator":
          continueSimulation = animateSpring(elapsed, params);
          break;
        case "newtons_cradle":
          continueSimulation = animateCradle(elapsed, params);
          break;
        case "free_fall":
          continueSimulation = animateFreeFall(elapsed, params);
          break;
        case "circular_motion":
          continueSimulation = animateCircularMotion(elapsed, params);
          break;
        case "wave_motion":
          continueSimulation = animateWaveMotion(elapsed, params);
          break;
        case "atwood_machine":
          continueSimulation = animateAtwoodMachine(elapsed, params);
          break;
        default:
          continueSimulation = false;
      }

      if (continueSimulation && elapsed < 60) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        stopSimulation();
        setShowResults(true);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [selectedExperiment]);

  // PROJECTILE ANIMATION
  const animateProjectile = (t, params) => {
    if (!projectileRef.current) return false;

    const pos = getProjectilePosition(params.velocity, params.angle, t);
    const newX = -10 + pos.x;
    const newY = 0.8 + pos.y;

    if (newY < 0.15) {
      // Landed
      projectileRef.current.position.y = 0.15;
      setMeasurements({
        finalRange: pos.x,
        maxHeight: Math.max(
          ...simulationDataRef.current.positions.map((p) => p.y),
          0
        ),
        flightTime: t,
        accuracy:
          (
            (pos.x / getProjectileRange(params.velocity, params.angle)) *
            100
          ).toFixed(1) + "%",
      });
      return false;
    }

    // Update projectile position
    projectileRef.current.position.x = newX;
    projectileRef.current.position.y = newY;

    // Add trajectory point
    trajectoryPointsRef.current.push(new BABYLON.Vector3(newX, newY, 0));
    simulationDataRef.current.positions.push({ x: pos.x, y: pos.y });
    simulationDataRef.current.times.push(t);

    // Update trajectory line
    updateTrajectoryMesh();

    // Live measurements
    setMeasurements({
      time: t.toFixed(2) + "s",
      x: pos.x.toFixed(2) + "m",
      y: pos.y.toFixed(2) + "m",
      velocity:
        Math.sqrt(
          Math.pow(
            params.velocity * Math.cos((params.angle * Math.PI) / 180),
            2
          ) +
            Math.pow(
              params.velocity * Math.sin((params.angle * Math.PI) / 180) -
                CONSTANTS.GRAVITY * t,
              2
            )
        ).toFixed(2) + "m/s",
    });

    return true;
  };

  // Update trajectory mesh
  const updateTrajectoryMesh = () => {
    const scene = sceneRef.current;
    if (!scene || trajectoryPointsRef.current.length < 2) return;

    if (trajectoryMeshRef.current) {
      trajectoryMeshRef.current.dispose();
    }

    // Create tube for trajectory (better than lines)
    const path = trajectoryPointsRef.current;
    if (path.length >= 2) {
      try {
        const tube = BABYLON.MeshBuilder.CreateTube(
          "trajectory",
          {
            path: path,
            radius: 0.03,
            tessellation: 8,
            updatable: false,
          },
          scene
        );
        const tubeMat = new BABYLON.StandardMaterial("trajMat", scene);
        tubeMat.emissiveColor = new BABYLON.Color3(0.1, 0.8, 0.3);
        tubeMat.alpha = 0.8;
        tube.material = tubeMat;
        trajectoryMeshRef.current = tube;
      } catch (e) {
        // Fallback to lines if tube fails
        const line = BABYLON.MeshBuilder.CreateLines(
          "trajectory",
          { points: path },
          scene
        );
        line.color = new BABYLON.Color3(0.1, 0.8, 0.3);
        trajectoryMeshRef.current = line;
      }
    }
  };

  // PENDULUM ANIMATION
  // PENDULUM ANIMATION - Educational with force arrows
  const animatePendulum = (t, params) => {
    if (!pendulumRef.current?.bob) return false;

    const {
      bob,
      string,
      gravityArrow,
      tensionArrow,
      length,
      pivotHeight,
      bobDiameter,
    } = pendulumRef.current;
    const actualLength = length || params.length || 2;
    const amplitude = ((params.amplitude || 20) * Math.PI) / 180;
    const actualPivotHeight = pivotHeight || 6;

    // Calculate current angle using physics
    const theta = pendulumPosition(amplitude, actualLength, t);
    const angularVelocity = pendulumVelocity(amplitude, actualLength, t);

    // Update bob position
    bob.position.x = actualLength * Math.sin(theta);
    bob.position.y = actualPivotHeight - actualLength * Math.cos(theta);

    // Update string
    if (string) updatePendulumString(string, actualPivotHeight, bob.position);

    // === UPDATE FORCE ARROWS ===
    const g = 9.81;
    const gravityForce = g; // Constant
    const tensionForce =
      g * Math.cos(theta) + actualLength * angularVelocity * angularVelocity; // T = mg*cos(θ) + mLω²

    // Gravity arrow - always points straight down
    if (gravityArrow) {
      gravityArrow.position.x = bob.position.x;
      gravityArrow.position.y = bob.position.y - (bobDiameter || 0.8) / 2 - 0.4;
      gravityArrow.rotation.z = Math.PI; // Point down
      gravityArrow.scaling.y = Math.min(1.5, gravityForce / 10); // Scale by force
    }

    // Tension arrow - points along string toward pivot
    if (tensionArrow) {
      tensionArrow.position.x = bob.position.x;
      tensionArrow.position.y = bob.position.y + (bobDiameter || 0.8) / 2 + 0.3;
      // Angle to point toward pivot
      tensionArrow.rotation.z = -theta;
      tensionArrow.scaling.y = Math.min(1.2, tensionForce / 15); // Scale by force
    }

    // Calculate current velocity for display
    const velocity = actualLength * Math.abs(angularVelocity);

    // Measurements with educational values
    setMeasurements({
      time: t.toFixed(2) + "s",
      angle: ((theta * 180) / Math.PI).toFixed(1) + "°",
      velocity: velocity.toFixed(2) + " m/s",
      period: pendulumPeriod(actualLength).toFixed(3) + "s",
      oscillations: (t / pendulumPeriod(actualLength)).toFixed(1),
    });

    return true;
  };

  // Helper: Calculate pendulum angular velocity
  const pendulumVelocity = (amplitude, length, t) => {
    const omega = Math.sqrt(9.81 / length);
    return -amplitude * omega * Math.sin(omega * t);
  };

  // COLLISION ANIMATION - With visual feedback
  const animateCollision = (t, params) => {
    if (collisionObjectsRef.current.length < 3) return false;

    const [obj1Data, obj2Data] = collisionObjectsRef.current;
    const { mesh: obj1 } = obj1Data;
    const { mesh: obj2 } = obj2Data;

    // Calculate collision point and time
    const relativeVelocity = params.velocity1 - params.velocity2;
    const initialDistance = 8; // Distance between objects
    const collisionTime = Math.abs(initialDistance / relativeVelocity);

    const hasCollided = t >= collisionTime;
    const justCollided = hasCollided && t < collisionTime + 0.3; // Flash for 0.3s

    // Visual collision feedback - flash on impact
    if (obj1.material && obj2.material) {
      if (justCollided) {
        // Flash bright on collision
        obj1.material.emissiveColor = new BABYLON.Color3(0.5, 0.8, 1.0);
        obj2.material.emissiveColor = new BABYLON.Color3(1.0, 0.7, 0.3);
      } else {
        // Normal colors
        obj1.material.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
        obj2.material.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.05);
      }
    }

    if (!hasCollided) {
      // Before collision - objects moving towards each other
      obj1.position.x = -4 + params.velocity1 * t;
      obj2.position.x = 4 + params.velocity2 * t;
    } else {
      // After collision - use elastic collision formulas
      const result = elasticCollision(
        params.mass1,
        params.velocity1,
        params.mass2,
        params.velocity2
      );
      const dt = t - collisionTime;

      // Position at collision
      const collisionX1 = -4 + params.velocity1 * collisionTime;
      const collisionX2 = 4 + params.velocity2 * collisionTime;

      obj1.position.x = collisionX1 + result.v1f * dt;
      obj2.position.x = collisionX2 + result.v2f * dt;
    }

    setMeasurements({
      time: t.toFixed(2) + "s",
      status: justCollided
        ? "💥 COLLISION!"
        : hasCollided
        ? "After Collision"
        : "Before Collision",
      obj1_x: obj1.position.x.toFixed(2) + "m",
      obj2_x: obj2.position.x.toFixed(2) + "m",
      total_momentum:
        (
          params.mass1 *
            (hasCollided ? theoreticalValues.v1_final : params.velocity1) +
          params.mass2 *
            (hasCollided ? theoreticalValues.v2_final : params.velocity2)
        ).toFixed(2) + " kg⋅m/s",
    });

    // Continue until objects are out of view (e.g. x > 8 or x < -8)
    return Math.abs(obj1.position.x) < 10 && Math.abs(obj2.position.x) < 10;
  };

  // INCLINED PLANE ANIMATION - Ball moves LEFT to RIGHT (X-axis)
  // INCLINED PLANE ANIMATION - Educational with force arrows
  const animateInclinedPlane = (t, params) => {
    if (!projectileRef.current || collisionObjectsRef.current.length < 1)
      return false;

    const planeData = collisionObjectsRef.current[0];
    const planeLength = planeData.length;
    const planeHeight = planeData.height;
    const planeWidth = planeData.width;
    const friction = planeData.friction || 0;
    const startX = planeData.startX;
    const startY = planeData.startY;
    const ballRadius = planeData.ballRadius || 0.35;

    // Acceleration: a = g(sin θ - μ cos θ)
    const g = 9.81;
    const angleRad = planeData.angle;
    const a = g * (Math.sin(angleRad) - friction * Math.cos(angleRad));

    if (a <= 0) {
      setMeasurements({
        status: "Ball stationary (friction too high)",
        acceleration: "0 m/s²",
      });
      return false;
    }

    const distance = 0.5 * a * t * t;
    const velocity = a * t;

    if (distance >= planeLength) {
      setMeasurements({
        finalVelocity: Math.sqrt(2 * a * planeLength).toFixed(2) + " m/s",
        timeToBottom: Math.sqrt((2 * planeLength) / a).toFixed(2) + " s",
        acceleration: a.toFixed(2) + " m/s²",
        friction: (friction * 100).toFixed(0) + "%",
      });
      return false;
    }

    // Update ball position
    const ball = projectileRef.current;
    const progress = distance / planeLength;
    ball.position.x = startX + progress * planeWidth;
    ball.position.y = startY - progress * planeHeight;
    ball.position.z = 0;

    // === UPDATE FORCE ARROWS TO FOLLOW BALL ===
    const { weightArrow, parallelArrow, normalArrow, frictionArrow } =
      planeData;

    if (weightArrow) {
      weightArrow.position.x = ball.position.x;
      weightArrow.position.y = ball.position.y - ballRadius - 0.5;
    }
    if (parallelArrow) {
      parallelArrow.position.x = ball.position.x + 0.3 * Math.cos(angleRad);
      parallelArrow.position.y = ball.position.y - 0.3 * Math.sin(angleRad);
    }
    if (normalArrow) {
      normalArrow.position.x = ball.position.x - 0.3 * Math.sin(angleRad);
      normalArrow.position.y = ball.position.y + 0.3 * Math.cos(angleRad);
    }
    if (frictionArrow) {
      frictionArrow.position.x = ball.position.x - 0.2 * Math.cos(angleRad);
      frictionArrow.position.y = ball.position.y + 0.2 * Math.sin(angleRad);
    }

    setMeasurements({
      time: t.toFixed(2) + "s",
      distance: distance.toFixed(2) + "m",
      velocity: velocity.toFixed(2) + " m/s",
      acceleration: a.toFixed(2) + " m/s²",
    });

    return true;
  };

  // SPRING ANIMATION
  const animateSpring = (t, params) => {
    if (!projectileRef.current || !pendulumRef.current) return false;

    const amplitude = params.amplitude || 0.1;
    const { equilibriumY, springHeight, springCoils } = pendulumRef.current;

    const y = springPosition(amplitude, params.mass, params.springConstant, t);
    projectileRef.current.position.y = equilibriumY + y;

    // Animate spring coils
    if (springCoils) {
      const stretch =
        (equilibriumY - projectileRef.current.position.y) /
        (equilibriumY - springHeight + 1.5);
      springCoils.forEach((coil, i) => {
        coil.position.y = springHeight - 0.2 - i * 0.15 * (1 + stretch * 0.5);
      });
    }

    const omega = Math.sqrt(params.springConstant / params.mass);
    const velocity = -amplitude * omega * Math.sin(omega * t);

    setMeasurements({
      time: t.toFixed(2) + "s",
      displacement: y.toFixed(3) + "m",
      velocity: velocity.toFixed(3) + " m/s",
      period: springPeriod(params.mass, params.springConstant).toFixed(3) + "s",
      oscillations: (
        t / springPeriod(params.mass, params.springConstant)
      ).toFixed(1),
    });

    return true;
  };

  // NEWTON'S CRADLE ANIMATION - Improved with proper phase separation
  const animateCradle = (t, params) => {
    if (!pendulumRef.current?.ballsData) return false;

    const { ballsData, baseY, stringLength } = pendulumRef.current;
    if (ballsData.length === 0) return false;

    const pullBack = Math.round(params.pullBack || 1);
    const period = 1.2; // Faster period for snappier motion
    const maxAngle = 0.45; // About 26 degrees
    const halfPeriod = period / 2;

    // Phase within the current cycle (0 to period)
    const phase = t % period;

    ballsData.forEach((ballData, i) => {
      const { ball, string, x } = ballData;
      let angle = 0;

      if (i < pullBack) {
        // LEFT balls: swing out in first half, rest in second half
        if (phase < halfPeriod) {
          // Swing out (positive angle = left)
          angle = maxAngle * Math.sin((Math.PI * phase) / halfPeriod);
        } else {
          // Rest at vertical (impact transferred to right side)
          angle = 0;
        }
      } else if (i >= ballsData.length - pullBack) {
        // RIGHT balls: rest in first half, swing out in second half
        if (phase < halfPeriod) {
          // Rest at vertical
          angle = 0;
        } else {
          // Swing out (negative angle = right)
          angle =
            -maxAngle * Math.sin((Math.PI * (phase - halfPeriod)) / halfPeriod);
        }
      }
      // Middle balls stay stationary (angle = 0)

      // Update ball position
      ball.position.x = x + stringLength * Math.sin(angle);
      ball.position.y = baseY - stringLength * Math.cos(angle);

      // Update string rotation and position
      string.rotation.z = -angle;
      string.position.x = x + (stringLength * Math.sin(angle)) / 2;
      string.position.y = baseY - (stringLength * Math.cos(angle)) / 2;
    });

    setMeasurements({
      time: t.toFixed(2) + "s",
      phase: phase < halfPeriod ? "Left swinging" : "Right swinging",
      balls_pulled: pullBack,
      oscillations: Math.floor(t / period),
    });

    return true;
  };

  // FREE FALL ANIMATION
  // FREE FALL ANIMATION - Educational with arrows
  const animateFreeFall = (t, params) => {
    if (!projectileRef.current || !pendulumRef.current) return false;

    const g = 9.81;
    const { startHeight, gravityArrow, velocityArrow, ballDiameter } =
      pendulumRef.current;
    const y = startHeight - 0.5 * g * t * t;
    const v = g * t;

    if (y <= 0.35) {
      projectileRef.current.position.y = 0.35;
      setMeasurements({
        final_velocity: Math.sqrt(2 * g * startHeight).toFixed(2) + " m/s",
        fall_time: t.toFixed(3) + " s",
        impact_energy: (0.5 * (params.mass || 1) * v * v).toFixed(2) + " J",
      });
      return false;
    }

    projectileRef.current.position.y = y;

    // === UPDATE ARROWS ===
    const ballRadius = (ballDiameter || 0.7) / 2;

    // Gravity arrow follows ball
    if (gravityArrow) {
      gravityArrow.position.y = y - ballRadius - 0.8;
    }

    // Velocity arrow grows as ball speeds up
    if (velocityArrow) {
      velocityArrow.position.y = y - ballRadius - 1.5;
      velocityArrow.scaling.y = Math.min(2, v / 10); // Scale with velocity
    }

    setMeasurements({
      time: t.toFixed(2) + "s",
      height: y.toFixed(2) + " m",
      velocity: v.toFixed(2) + " m/s",
      distance_fallen: (startHeight - y).toFixed(2) + " m",
    });

    return true;
  };

  // CIRCULAR MOTION ANIMATION
  const animateCircularMotion = (t, params) => {
    if (!projectileRef.current || !pendulumRef.current) return false;

    const { rod, radius, centerY } = pendulumRef.current;
    const omega = params.speed / radius;
    const theta = omega * t;

    // Update orbiting ball position
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    projectileRef.current.position.x = x;
    projectileRef.current.position.z = z;
    projectileRef.current.position.y = centerY;

    // Update rod
    if (rod) {
      rod.position.x = x / 2;
      rod.position.z = z / 2;
      rod.rotation.y = -theta;
    }

    const period = (2 * Math.PI * radius) / params.speed;
    setMeasurements({
      time: t.toFixed(2) + "s",
      angle: (((theta * 180) / Math.PI) % 360).toFixed(1) + "°",
      revolutions: (t / period).toFixed(2),
      centripetal_accel:
        ((params.speed * params.speed) / radius).toFixed(2) + " m/s²",
    });

    return true;
  };

  // WAVE MOTION ANIMATION
  const animateWaveMotion = (t, params) => {
    if (!pendulumRef.current?.waveLine) return false;

    const { waveLine, wavePoints, particle, numPoints, waveLength } =
      pendulumRef.current;
    const amplitude = params.amplitude;
    const wavelength = params.wavelength;
    const frequency = params.frequency;
    const k = (2 * Math.PI) / wavelength;
    const omega = 2 * Math.PI * frequency;

    // Update wave points
    const newPoints = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * waveLength - waveLength / 2;
      const y = 2 + amplitude * Math.sin(k * x - omega * t);
      newPoints.push(new BABYLON.Vector3(x, y, 0));
    }

    // Update wave line
    waveLine.dispose();
    const scene = sceneRef.current;
    const newWaveLine = trackMesh(
      BABYLON.MeshBuilder.CreateLines(
        "waveLine",
        { points: newPoints, updatable: true },
        scene
      )
    );
    newWaveLine.color = new BABYLON.Color3(0.2, 0.7, 0.9);
    pendulumRef.current.waveLine = newWaveLine;

    // Update particle position (shows wave motion of a single point)
    if (particle) {
      particle.position.y = 2 + amplitude * Math.sin(-omega * t);
    }

    setMeasurements({
      time: t.toFixed(2) + "s",
      wave_position: (amplitude * Math.sin(-omega * t)).toFixed(3) + " m",
      phase: (((omega * t * 180) / Math.PI) % 360).toFixed(1) + "°",
      cycles: (frequency * t).toFixed(2),
    });

    return true;
  };

  // ATWOOD MACHINE ANIMATION - Fixed to handle m1 < m2 case
  const animateAtwoodMachine = (t, params) => {
    if (!pendulumRef.current?.mass1) return false;

    const {
      mass1,
      mass2,
      string1,
      string2,
      pulley,
      pulleyY,
      initialY1,
      initialY2,
    } = pendulumRef.current;
    const g = 9.81;
    const m1 = params.mass1,
      m2 = params.mass2;

    // Acceleration can be positive or negative depending on mass ratio
    // a > 0 means mass1 goes down, a < 0 means mass1 goes up
    const a = ((m1 - m2) * g) / (m1 + m2);

    // Distance moved (can be negative if m2 > m1)
    const s = 0.5 * a * t * t;
    const v = a * t;

    // Limit movement in either direction
    const maxDrop = 3;
    if (Math.abs(s) >= maxDrop) {
      const finalV = Math.sign(a) * Math.sqrt(2 * Math.abs(a) * maxDrop);
      setMeasurements({
        final_velocity: Math.abs(finalV).toFixed(2) + " m/s",
        distance_moved: maxDrop.toFixed(2) + " m",
        heavier_mass: m1 > m2 ? "Left (Red)" : "Right (Blue)",
        time: t.toFixed(2) + "s",
      });
      return false;
    }

    // Mass 1 position changes by -s (down if a>0, up if a<0)
    // Mass 2 position changes by +s (up if a>0, down if a<0)
    mass1.position.y = initialY1 - s;
    mass2.position.y = initialY2 + s;

    // Update strings
    const stringLen1 = Math.max(0.1, pulleyY - mass1.position.y - 0.2);
    const stringLen2 = Math.max(0.1, pulleyY - mass2.position.y - 0.2);
    string1.scaling.y = stringLen1 / 2;
    string1.position.y = pulleyY - stringLen1 / 2;
    string2.scaling.y = stringLen2 / 2;
    string2.position.y = pulleyY - stringLen2 / 2;

    // Rotate pulley based on movement direction
    if (pulley) {
      pulley.rotation.z = s / 0.4;
    }

    setMeasurements({
      time: t.toFixed(2) + "s",
      distance: Math.abs(s).toFixed(3) + " m",
      velocity: Math.abs(v).toFixed(3) + " m/s",
      acceleration: Math.abs(a).toFixed(3) + " m/s²",
      direction: a >= 0 ? "Left↓ Right↑" : "Left↑ Right↓",
    });

    return true;
  };

  // Stop simulation
  const stopSimulation = useCallback(() => {
    isSimulatingRef.current = false;
    setIsSimulating(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Reset experiment
  const resetExperiment = useCallback(() => {
    stopSimulation();
    setShowResults(false);
    setMeasurements({});
    setSimulationTime(0);
    trajectoryPointsRef.current = [];

    if (trajectoryMeshRef.current) {
      trajectoryMeshRef.current.dispose();
      trajectoryMeshRef.current = null;
    }

    if (selectedExperiment) {
      clearSimulationObjects();
      setupExperiment(selectedExperiment, experimentParams);
    }
  }, [selectedExperiment, experimentParams, stopSimulation]);

  // AI EXPLANATION
  const getAIExplanation = async () => {
    if (!selectedExperiment) return;

    setIsLoadingAI(true);
    setShowAIPanel(true);

    try {
      const token = localStorage.getItem("token");
      const prompt = `Explain the physics concept of "${
        selectedExperiment.name
      }" in simple terms. 
      Include:
      1. What is happening physically
      2. The key formulas: ${selectedExperiment.formulas.join(", ")}
      3. Real-world applications
      4. Common misconceptions
      Keep the explanation concise and educational, suitable for a student.`;

      const response = await axios.post(
        "/api/chat",
        { message: prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAiExplanation(
        response.data.response ||
          response.data.message ||
          "Explanation not available."
      );
    } catch (error) {
      console.error("AI explanation error:", error);
      setAiExplanation(
        `**${selectedExperiment.name}**\n\n` +
          `This experiment demonstrates ${selectedExperiment.description.toLowerCase()}.\n\n` +
          `**Key Formulas:**\n${selectedExperiment.formulas
            .map((f) => `- ${f}`)
            .join("\n")}\n\n` +
          `*AI explanation unavailable. Please check if AI service is running.*`
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Camera control functions for 3D navigation
  const rotateCamera = (direction) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const step = 0.15;
    switch (direction) {
      case "left":
        camera.alpha -= step;
        break;
      case "right":
        camera.alpha += step;
        break;
      case "up":
        camera.beta = Math.max(0.1, camera.beta - step);
        break;
      case "down":
        camera.beta = Math.min(Math.PI - 0.1, camera.beta + step);
        break;
      default:
        break;
    }
  };

  const zoomCamera = (direction) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const step = 2;
    if (direction === "in") {
      camera.radius = Math.max(camera.lowerRadiusLimit, camera.radius - step);
    } else {
      camera.radius = Math.min(camera.upperRadiusLimit, camera.radius + step);
    }
  };

  const resetCamera = () => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    camera.alpha = -Math.PI / 2;
    camera.beta = Math.PI / 3.5;
    camera.radius = 15;
    camera.target = new BABYLON.Vector3(0, 2, 0);
  };

  return (
    <div className="physics-lab">
      {isLoading && (
        <div className="physics-loading">
          <div className="physics-loading-spinner"></div>
          <p>Loading Physics Lab...</p>
        </div>
      )}

      <header className="physics-header">
        <div className="physics-header-left">
          <button
            className="physics-back-btn"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
          <h1>⚛️ Physics Lab</h1>
        </div>
        <div className="physics-header-right">
          <span className={`physics-time ${isSimulating ? "simulating" : ""}`}>
            ⏱️ {formatValue(simulationTime, 2)}s
          </span>
          <button
            className="physics-panel-toggle"
            onClick={() => setShowExperimentPanel(!showExperimentPanel)}
          >
            {showExperimentPanel ? "◀" : "▶"} Experiments
          </button>
        </div>
      </header>

      <div className="physics-content">
        <canvas ref={canvasRef} className="physics-canvas" />

        {/* 3D Navigation Controls */}
        <div className="physics-nav-controls">
          <div className="nav-control-group">
            <span className="nav-label">Rotate</span>
            <button onClick={() => rotateCamera("left")} title="Rotate Left">
              ◀
            </button>
            <button onClick={() => rotateCamera("up")} title="Rotate Up">
              ▲
            </button>
            <button onClick={() => rotateCamera("down")} title="Rotate Down">
              ▼
            </button>
            <button onClick={() => rotateCamera("right")} title="Rotate Right">
              ▶
            </button>
          </div>
          <div className="nav-control-group">
            <span className="nav-label">Zoom</span>
            <button onClick={() => zoomCamera("in")} title="Zoom In">
              +
            </button>
            <button onClick={() => zoomCamera("out")} title="Zoom Out">
              −
            </button>
          </div>
          <button
            className="nav-reset-btn"
            onClick={resetCamera}
            title="Reset View"
          >
            ⟲ Reset View
          </button>
        </div>

        {showExperimentPanel && (
          <aside className="physics-experiments-panel">
            <h2>🔬 Experiments</h2>
            <div className="physics-experiments-list">
              {experiments.map((exp) => (
                <div
                  key={exp.id}
                  className={`physics-experiment-card ${
                    selectedExperiment?.id === exp.id ? "selected" : ""
                  }`}
                  onClick={() => handleSelectExperiment(exp)}
                >
                  <span className="physics-exp-icon">{exp.icon}</span>
                  <div className="physics-exp-info">
                    <h3>{exp.name}</h3>
                    <p>{exp.description}</p>
                    <span
                      className={`physics-exp-difficulty ${exp.difficulty}`}
                    >
                      {exp.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {selectedExperiment && (
          <aside className="physics-controls-panel">
            <h2>
              {selectedExperiment.icon} {selectedExperiment.name}
            </h2>

            <div className="physics-variables">
              <h3>⚙️ Variables</h3>
              {selectedExperiment.variables.map((v) => (
                <div key={v.name} className="physics-variable">
                  <label>
                    {v.label}
                    <span className="physics-var-value">
                      {formatValue(experimentParams[v.name] || v.default, 2)}{" "}
                      {v.unit}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={v.min}
                    max={v.max}
                    step={(v.max - v.min) / 100}
                    value={experimentParams[v.name] || v.default}
                    onChange={(e) => handleParamChange(v.name, e.target.value)}
                    disabled={isSimulating}
                  />
                </div>
              ))}
            </div>

            <div className="physics-formulas">
              <h3>📐 Formulas</h3>
              {selectedExperiment.formulas.map((f, i) => (
                <div key={i} className="physics-formula">
                  {f}
                </div>
              ))}
            </div>

            {Object.keys(theoreticalValues).length > 0 && (
              <div className="physics-theoretical">
                <h3>📊 Predicted Values</h3>
                {Object.entries(theoreticalValues).map(([key, val]) => (
                  <div key={key} className="physics-theory-item">
                    <span>{key.replace(/_/g, " ")}:</span>
                    <span>
                      {typeof val === "number" ? formatValue(val, 3) : val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="physics-actions">
              {!isSimulating ? (
                <button className="physics-run-btn" onClick={runSimulation}>
                  ▶ Run Simulation
                </button>
              ) : (
                <button className="physics-stop-btn" onClick={stopSimulation}>
                  ⏹ Stop
                </button>
              )}
              <button className="physics-reset-btn" onClick={resetExperiment}>
                🔄 Reset
              </button>
            </div>

            <button className="physics-ai-btn" onClick={getAIExplanation}>
              🤖 AI Explain
            </button>

            {Object.keys(measurements).length > 0 && (
              <div className="physics-measurements">
                <h3>📈 Live Data</h3>
                {Object.entries(measurements).map(([key, val]) => (
                  <div key={key} className="physics-measurement-item">
                    <span>{key.replace(/_/g, " ")}:</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* AI Explanation Panel */}
        {showAIPanel && (
          <div className="physics-ai-panel">
            <div className="physics-ai-header">
              <h3>🤖 AI Explanation</h3>
              <button onClick={() => setShowAIPanel(false)}>✕</button>
            </div>
            <div className="physics-ai-content">
              {isLoadingAI ? (
                <div className="physics-ai-loading">
                  <div className="physics-loading-spinner small"></div>
                  <p>Generating explanation...</p>
                </div>
              ) : (
                <div className="physics-ai-text">
                  {aiExplanation.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showResults && (
          <div className="physics-results-overlay">
            <div className="physics-results-card">
              <h2>🎯 Experiment Complete!</h2>
              <div className="physics-results-content">
                <div className="physics-results-section">
                  <h3>📏 Measured Values</h3>
                  {Object.entries(measurements).map(([key, val]) => (
                    <div key={key} className="physics-result-row">
                      <span>{key.replace(/_/g, " ")}:</span>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
                <div className="physics-results-section">
                  <h3>📐 Theoretical Values</h3>
                  {Object.entries(theoreticalValues).map(([key, val]) => (
                    <div key={key} className="physics-result-row">
                      <span>{key.replace(/_/g, " ")}:</span>
                      <span>
                        {typeof val === "number" ? formatValue(val, 3) : val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="physics-results-actions">
                <button
                  className="physics-close-results"
                  onClick={() => setShowResults(false)}
                >
                  Close
                </button>
                <button className="physics-ai-btn" onClick={getAIExplanation}>
                  🤖 Explain Results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysicsLab;
