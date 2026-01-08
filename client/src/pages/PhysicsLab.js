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

  // Setup projectile motion with launcher
  const setupProjectileMotion = (scene, params) => {
    // Launcher base
    const launcher = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "launcher",
        { width: 0.8, height: 0.4, depth: 0.8 },
        scene
      )
    );
    launcher.position = new BABYLON.Vector3(-10, 0.2, 0);
    const launcherMat = new BABYLON.PBRMaterial("launcherMat", scene);
    launcherMat.albedoColor = new BABYLON.Color3(0.2, 0.25, 0.3);
    launcherMat.metallic = 0.7;
    launcherMat.roughness = 0.4;
    launcher.material = launcherMat;
    launcherRef.current = launcher;

    // Launcher barrel
    const barrel = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "barrel",
        { height: 1.2, diameter: 0.25 },
        scene
      )
    );
    barrel.position = new BABYLON.Vector3(0, 0.5, 0);
    barrel.rotation.z = -((params.angle || 45) * Math.PI) / 180 + Math.PI / 2;
    barrel.material = launcherMat;
    barrel.parent = launcher;

    // Projectile (glowing sphere)
    const projectile = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "projectile",
        { diameter: 0.3, segments: 16 },
        scene
      )
    );
    projectile.position = new BABYLON.Vector3(-10, 0.8, 0);
    const projMat = new BABYLON.PBRMaterial("projMat", scene);
    projMat.albedoColor = new BABYLON.Color3(1, 0.3, 0.1);
    projMat.emissiveColor = new BABYLON.Color3(0.6, 0.15, 0.05);
    projMat.metallic = 0.9;
    projMat.roughness = 0.1;
    projectile.material = projMat;
    projectileRef.current = projectile;

    // Ground target zone
    const target = trackMesh(
      BABYLON.MeshBuilder.CreateDisc(
        "target",
        { radius: 0.8, tessellation: 32 },
        scene
      )
    );
    const range = getProjectileRange(params.velocity, params.angle);
    target.position = new BABYLON.Vector3(-10 + range, 0.02, 0);
    target.rotation.x = Math.PI / 2;
    const targetMat = new BABYLON.StandardMaterial("targetMat", scene);
    targetMat.emissiveColor = new BABYLON.Color3(0.1, 0.6, 0.2);
    targetMat.alpha = 0.6;
    target.material = targetMat;

    // Add glow layer for projectile
    const glowLayer = new BABYLON.GlowLayer("glow", scene, {
      mainTextureFixedSize: 256,
      blurKernelSize: 64,
    });
    glowLayer.intensity = 0.5;
    glowLayer.addIncludedOnlyMesh(projectile);

    setTheoreticalValues({
      range: getProjectileRange(params.velocity, params.angle),
      maxHeight: getMaxHeight(params.velocity, params.angle),
      timeOfFlight: getTimeOfFlight(params.velocity, params.angle),
    });
  };

  // Setup pendulum
  const setupPendulum = (scene, params) => {
    const pivotHeight = 6;
    const length = params.length || 1;

    // Support frame
    const frame = BABYLON.MeshBuilder.CreateBox(
      "frame",
      { width: 0.1, height: pivotHeight, depth: 0.1 },
      scene
    );
    frame.position = new BABYLON.Vector3(0, pivotHeight / 2, 0);
    const frameMat = new BABYLON.PBRMaterial("frameMat", scene);
    frameMat.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    frameMat.metallic = 0.8;
    frame.material = frameMat;

    // Pivot point
    const pivot = BABYLON.MeshBuilder.CreateSphere(
      "pivot",
      { diameter: 0.15 },
      scene
    );
    pivot.position = new BABYLON.Vector3(0, pivotHeight, 0);
    pivot.material = frameMat;

    // Bob (golden sphere)
    const bob = BABYLON.MeshBuilder.CreateSphere(
      "bob",
      { diameter: 0.5 },
      scene
    );
    const angleRad = ((params.amplitude || 15) * Math.PI) / 180;
    bob.position = new BABYLON.Vector3(
      length * Math.sin(angleRad),
      pivotHeight - length * Math.cos(angleRad),
      0
    );
    const bobMat = new BABYLON.PBRMaterial("bobMat", scene);
    bobMat.albedoColor = new BABYLON.Color3(0.9, 0.7, 0.2);
    bobMat.metallic = 0.95;
    bobMat.roughness = 0.1;
    bob.material = bobMat;

    // String
    const string = BABYLON.MeshBuilder.CreateCylinder(
      "string",
      { height: length, diameter: 0.03 },
      scene
    );
    const stringMat = new BABYLON.StandardMaterial("stringMat", scene);
    stringMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    string.material = stringMat;
    updatePendulumString(string, pivotHeight, bob.position);

    pendulumRef.current = { frame, pivot, bob, string };

    setTheoreticalValues({
      period: pendulumPeriod(length),
      frequency: 1 / pendulumPeriod(length),
    });
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
  const setupCollision = (scene, params) => {
    // Track
    const track = BABYLON.MeshBuilder.CreateBox(
      "track",
      { width: 12, height: 0.05, depth: 0.8 },
      scene
    );
    track.position = new BABYLON.Vector3(0, 0.025, 0);
    const trackMat = new BABYLON.PBRMaterial("trackMat", scene);
    trackMat.albedoColor = new BABYLON.Color3(0.15, 0.15, 0.2);
    trackMat.metallic = 0.3;
    track.material = trackMat;

    // Object 1 (blue)
    const size1 = 0.3 + params.mass1 * 0.05;
    const obj1 = BABYLON.MeshBuilder.CreateSphere(
      "obj1",
      { diameter: size1 },
      scene
    );
    obj1.position = new BABYLON.Vector3(-4, size1 / 2 + 0.05, 0);
    const mat1 = new BABYLON.PBRMaterial("mat1", scene);
    mat1.albedoColor = new BABYLON.Color3(0.2, 0.4, 0.9);
    mat1.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
    mat1.metallic = 0.7;
    obj1.material = mat1;

    // Object 2 (orange)
    const size2 = 0.3 + params.mass2 * 0.05;
    const obj2 = BABYLON.MeshBuilder.CreateSphere(
      "obj2",
      { diameter: size2 },
      scene
    );
    obj2.position = new BABYLON.Vector3(4, size2 / 2 + 0.05, 0);
    const mat2 = new BABYLON.PBRMaterial("mat2", scene);
    mat2.albedoColor = new BABYLON.Color3(0.9, 0.4, 0.2);
    mat2.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.05);
    mat2.metallic = 0.7;
    obj2.material = mat2;

    collisionObjectsRef.current = [
      {
        mesh: obj1,
        mass: params.mass1,
        velocity: params.velocity1,
        initialX: -4,
      },
      {
        mesh: obj2,
        mass: params.mass2,
        velocity: params.velocity2,
        initialX: 4,
      },
      { mesh: track },
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

  // Setup inclined plane
  const setupInclinedPlane = (scene, params) => {
    const angle = params.angle || 30;
    const angleRad = (angle * Math.PI) / 180;
    const planeLength = 6;
    const planeHeight = planeLength * Math.sin(angleRad);

    // Inclined plane
    const plane = BABYLON.MeshBuilder.CreateBox(
      "inclined",
      {
        width: 2,
        height: 0.1,
        depth: planeLength,
      },
      scene
    );
    plane.rotation.x = -angleRad;
    plane.position = new BABYLON.Vector3(
      0,
      planeHeight / 2,
      (planeLength * Math.cos(angleRad)) / 2 - planeLength / 2
    );
    const planeMat = new BABYLON.PBRMaterial("planeMat", scene);
    planeMat.albedoColor = new BABYLON.Color3(0.35, 0.4, 0.45);
    planeMat.metallic = 0.4;
    plane.material = planeMat;

    // Ball
    const ball = BABYLON.MeshBuilder.CreateSphere(
      "ball",
      { diameter: 0.35 },
      scene
    );
    ball.position = new BABYLON.Vector3(
      0,
      planeHeight + 0.25,
      -planeLength / 2 + 0.3
    );
    const ballMat = new BABYLON.PBRMaterial("ballMat", scene);
    ballMat.albedoColor = new BABYLON.Color3(0.2, 0.8, 0.3);
    ballMat.emissiveColor = new BABYLON.Color3(0.05, 0.2, 0.08);
    ballMat.metallic = 0.6;
    ball.material = ballMat;

    projectileRef.current = ball;
    collisionObjectsRef.current = [
      {
        mesh: plane,
        angle: angleRad,
        length: planeLength,
        height: planeHeight,
      },
    ];

    const a = inclinedPlaneAcceleration(angle);
    setTheoreticalValues({
      acceleration: a,
      finalVelocity: Math.sqrt(2 * a * planeLength),
      timeToBottom: Math.sqrt((2 * planeLength) / a),
    });
  };

  // Setup spring oscillator
  const setupSpringOscillator = (scene, params) => {
    const springHeight = 5;
    const equilibriumY = springHeight - 1.5;
    const amplitude = params.amplitude || 0.1;

    // Support
    const support = BABYLON.MeshBuilder.CreateBox(
      "support",
      { width: 1.5, height: 0.15, depth: 0.8 },
      scene
    );
    support.position = new BABYLON.Vector3(0, springHeight, 0);
    const supportMat = new BABYLON.PBRMaterial("supportMat", scene);
    supportMat.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    supportMat.metallic = 0.7;
    support.material = supportMat;

    // Spring coils (visual)
    const springCoils = [];
    const numCoils = 8;
    for (let i = 0; i < numCoils; i++) {
      const coil = BABYLON.MeshBuilder.CreateTorus(
        `coil${i}`,
        {
          diameter: 0.3,
          thickness: 0.03,
          tessellation: 20,
        },
        scene
      );
      coil.rotation.x = Math.PI / 2;
      coil.position.y = springHeight - 0.2 - i * 0.15;
      const coilMat = new BABYLON.StandardMaterial(`coilMat${i}`, scene);
      coilMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.55);
      coil.material = coilMat;
      springCoils.push(coil);
    }

    // Mass block
    const mass = BABYLON.MeshBuilder.CreateBox(
      "mass",
      { width: 0.6, height: 0.4, depth: 0.6 },
      scene
    );
    mass.position = new BABYLON.Vector3(0, equilibriumY - amplitude, 0);
    const massMat = new BABYLON.PBRMaterial("massMat", scene);
    massMat.albedoColor = new BABYLON.Color3(0.7, 0.25, 0.5);
    massMat.metallic = 0.6;
    mass.material = massMat;

    projectileRef.current = mass;
    collisionObjectsRef.current = [
      { mesh: support },
      ...springCoils.map((c) => ({ mesh: c })),
    ];
    pendulumRef.current = { springCoils, equilibriumY, springHeight };

    setTheoreticalValues({
      period: springPeriod(params.mass, params.springConstant),
      frequency: 1 / springPeriod(params.mass, params.springConstant),
      maxVelocity: amplitude * Math.sqrt(params.springConstant / params.mass),
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

  // Setup Free Fall
  const setupFreeFall = (scene, params) => {
    const height = params.height || 10;

    // Tower/platform
    const platform = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "platform",
        { width: 2, height: 0.2, depth: 2 },
        scene
      )
    );
    platform.position = new BABYLON.Vector3(0, height, 0);
    const platformMat = new BABYLON.PBRMaterial("platformMat", scene);
    platformMat.albedoColor = new BABYLON.Color3(0.3, 0.35, 0.4);
    platformMat.metallic = 0.6;
    platform.material = platformMat;

    // Support pillar
    const pillar = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "pillar",
        { width: 0.3, height: height, depth: 0.3 },
        scene
      )
    );
    pillar.position = new BABYLON.Vector3(-0.7, height / 2, 0);
    pillar.material = platformMat;

    // Falling object
    const ball = trackMesh(
      BABYLON.MeshBuilder.CreateSphere(
        "fallingBall",
        { diameter: 0.5, segments: 16 },
        scene
      )
    );
    ball.position = new BABYLON.Vector3(0, height - 0.35, 0);
    const ballMat = new BABYLON.PBRMaterial("fallingBallMat", scene);
    ballMat.albedoColor = new BABYLON.Color3(0.9, 0.3, 0.2);
    ballMat.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.02);
    ballMat.metallic = 0.7;
    ball.material = ballMat;

    // Ground target
    const ground = trackMesh(
      BABYLON.MeshBuilder.CreateDisc(
        "groundTarget",
        { radius: 1.5, tessellation: 32 },
        scene
      )
    );
    ground.position = new BABYLON.Vector3(0, 0.01, 0);
    ground.rotation.x = Math.PI / 2;
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.1);
    groundMat.alpha = 0.5;
    ground.material = groundMat;

    projectileRef.current = ball;
    pendulumRef.current = { startHeight: height - 0.35 };

    const g = 9.81;
    setTheoreticalValues({
      final_velocity: Math.sqrt(2 * g * height).toFixed(2) + " m/s",
      fall_time: Math.sqrt((2 * height) / g).toFixed(2) + " s",
      impact_energy: (0.5 * params.mass * 2 * g * height).toFixed(2) + " J",
    });
  };

  // Setup Circular Motion
  const setupCircularMotion = (scene, params) => {
    const radius = params.radius || 2;

    // Central pivot
    const pivot = trackMesh(
      BABYLON.MeshBuilder.CreateSphere("pivot", { diameter: 0.3 }, scene)
    );
    pivot.position = new BABYLON.Vector3(0, 3, 0);
    const pivotMat = new BABYLON.PBRMaterial("pivotMat", scene);
    pivotMat.albedoColor = new BABYLON.Color3(0.4, 0.4, 0.45);
    pivotMat.metallic = 0.9;
    pivot.material = pivotMat;

    // Orbiting object
    const orb = trackMesh(
      BABYLON.MeshBuilder.CreateSphere("orbitingBall", { diameter: 0.4 }, scene)
    );
    orb.position = new BABYLON.Vector3(radius, 3, 0);
    const orbMat = new BABYLON.PBRMaterial("orbMat", scene);
    orbMat.albedoColor = new BABYLON.Color3(0.2, 0.6, 0.9);
    orbMat.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.25);
    orbMat.metallic = 0.8;
    orb.material = orbMat;

    // Connecting string/rod
    const rod = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "rod",
        { height: radius, diameter: 0.05 },
        scene
      )
    );
    rod.position = new BABYLON.Vector3(radius / 2, 3, 0);
    rod.rotation.z = Math.PI / 2;
    const rodMat = new BABYLON.StandardMaterial("rodMat", scene);
    rodMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    rod.material = rodMat;

    // Orbit path visualization
    const orbitPath = trackMesh(
      BABYLON.MeshBuilder.CreateTorus(
        "orbitPath",
        { diameter: radius * 2, thickness: 0.02, tessellation: 64 },
        scene
      )
    );
    orbitPath.position = new BABYLON.Vector3(0, 3, 0);
    orbitPath.rotation.x = Math.PI / 2;
    const pathMat = new BABYLON.StandardMaterial("pathMat", scene);
    pathMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.1);
    pathMat.alpha = 0.5;
    orbitPath.material = pathMat;

    projectileRef.current = orb;
    pendulumRef.current = { pivot, rod, radius, centerY: 3 };

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
  const setupWaveMotion = (scene, params) => {
    const amplitude = params.amplitude || 0.5;
    const wavelength = params.wavelength || 2;
    const numPoints = 100;
    const waveLength = 15;

    // Create wave points
    const wavePoints = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * waveLength - waveLength / 2;
      wavePoints.push(new BABYLON.Vector3(x, 2, 0));
    }

    // Wave line (will be updated in animation)
    const waveLine = trackMesh(
      BABYLON.MeshBuilder.CreateLines(
        "waveLine",
        { points: wavePoints, updatable: true },
        scene
      )
    );
    waveLine.color = new BABYLON.Color3(0.2, 0.7, 0.9);

    // Reference markers
    const startMarker = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "startMarker",
        { width: 0.1, height: 3, depth: 0.1 },
        scene
      )
    );
    startMarker.position = new BABYLON.Vector3(-waveLength / 2, 2, 0);
    const markerMat = new BABYLON.StandardMaterial("markerMat", scene);
    markerMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    startMarker.material = markerMat;

    const endMarker = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "endMarker",
        { width: 0.1, height: 3, depth: 0.1 },
        scene
      )
    );
    endMarker.position = new BABYLON.Vector3(waveLength / 2, 2, 0);
    endMarker.material = markerMat;

    // Particle marker to show wave motion
    const particle = trackMesh(
      BABYLON.MeshBuilder.CreateSphere("waveParticle", { diameter: 0.3 }, scene)
    );
    particle.position = new BABYLON.Vector3(0, 2, 0);
    const particleMat = new BABYLON.PBRMaterial("particleMat", scene);
    particleMat.albedoColor = new BABYLON.Color3(0.9, 0.4, 0.2);
    particleMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.05);
    particle.material = particleMat;

    pendulumRef.current = {
      waveLine,
      wavePoints,
      particle,
      numPoints,
      waveLength,
      amplitude,
      wavelength,
    };

    const v = params.frequency * wavelength;
    setTheoreticalValues({
      wave_speed: v.toFixed(2) + " m/s",
      angular_freq: (2 * Math.PI * params.frequency).toFixed(2) + " rad/s",
      wave_number: ((2 * Math.PI) / wavelength).toFixed(2) + " rad/m",
    });
  };

  // Setup Atwood Machine
  const setupAtwoodMachine = (scene, params) => {
    const pulleyY = 6;
    const stringLength = 4;

    // Pulley
    const pulley = trackMesh(
      BABYLON.MeshBuilder.CreateTorus(
        "pulley",
        { diameter: 0.8, thickness: 0.1, tessellation: 32 },
        scene
      )
    );
    pulley.position = new BABYLON.Vector3(0, pulleyY, 0);
    pulley.rotation.x = Math.PI / 2;
    const pulleyMat = new BABYLON.PBRMaterial("pulleyMat", scene);
    pulleyMat.albedoColor = new BABYLON.Color3(0.4, 0.4, 0.45);
    pulleyMat.metallic = 0.9;
    pulley.material = pulleyMat;

    // Pulley axle
    const axle = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "axle",
        { height: 0.3, diameter: 0.15 },
        scene
      )
    );
    axle.position = new BABYLON.Vector3(0, pulleyY, 0);
    axle.rotation.x = Math.PI / 2;
    axle.material = pulleyMat;

    // Support frame
    const support = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "support",
        { width: 0.15, height: pulleyY + 0.5, depth: 0.15 },
        scene
      )
    );
    support.position = new BABYLON.Vector3(0, (pulleyY + 0.5) / 2, -0.3);
    support.material = pulleyMat;

    // Mass 1 (heavier - left side)
    const size1 = 0.3 + params.mass1 * 0.03;
    const mass1 = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "mass1",
        { width: size1, height: size1, depth: size1 },
        scene
      )
    );
    mass1.position = new BABYLON.Vector3(
      -0.4,
      pulleyY - stringLength / 2 - 0.5,
      0
    );
    const mass1Mat = new BABYLON.PBRMaterial("mass1Mat", scene);
    mass1Mat.albedoColor = new BABYLON.Color3(0.8, 0.3, 0.3);
    mass1Mat.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.05);
    mass1Mat.metallic = 0.6;
    mass1.material = mass1Mat;

    // Mass 2 (lighter - right side)
    const size2 = 0.3 + params.mass2 * 0.03;
    const mass2 = trackMesh(
      BABYLON.MeshBuilder.CreateBox(
        "mass2",
        { width: size2, height: size2, depth: size2 },
        scene
      )
    );
    mass2.position = new BABYLON.Vector3(
      0.4,
      pulleyY - stringLength / 2 + 0.5,
      0
    );
    const mass2Mat = new BABYLON.PBRMaterial("mass2Mat", scene);
    mass2Mat.albedoColor = new BABYLON.Color3(0.3, 0.5, 0.8);
    mass2Mat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
    mass2Mat.metallic = 0.6;
    mass2.material = mass2Mat;

    // Strings
    const string1 = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "string1",
        { height: stringLength / 2, diameter: 0.02 },
        scene
      )
    );
    string1.position = new BABYLON.Vector3(-0.4, pulleyY - stringLength / 4, 0);
    const stringMat = new BABYLON.StandardMaterial("stringMat", scene);
    stringMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    string1.material = stringMat;

    const string2 = trackMesh(
      BABYLON.MeshBuilder.CreateCylinder(
        "string2",
        { height: stringLength / 2, diameter: 0.02 },
        scene
      )
    );
    string2.position = new BABYLON.Vector3(0.4, pulleyY - stringLength / 4, 0);
    string2.material = stringMat;

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
      initialY1: mass1.position.y,
      initialY2: mass2.position.y,
    };

    const g = 9.81;
    const m1 = params.mass1,
      m2 = params.mass2;
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

      if (continueSimulation && elapsed < 15) {
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
  const animatePendulum = (t, params) => {
    if (!pendulumRef.current?.bob) return false;

    const { bob, string } = pendulumRef.current;
    const length = params.length || 1;
    const amplitude = ((params.amplitude || 15) * Math.PI) / 180;
    const pivotHeight = 6;

    const theta = pendulumPosition(amplitude, length, t);

    // Update bob position
    bob.position.x = length * Math.sin(theta);
    bob.position.y = pivotHeight - length * Math.cos(theta);

    // Update string
    updatePendulumString(string, pivotHeight, bob.position);

    // Measurements
    setMeasurements({
      time: t.toFixed(2) + "s",
      angle: ((theta * 180) / Math.PI).toFixed(1) + "°",
      period: pendulumPeriod(length).toFixed(3) + "s",
      oscillations: (t / pendulumPeriod(length)).toFixed(1),
    });

    return true;
  };

  // COLLISION ANIMATION
  const animateCollision = (t, params) => {
    if (collisionObjectsRef.current.length < 3) return false;

    const [obj1Data, obj2Data] = collisionObjectsRef.current;
    const { mesh: obj1 } = obj1Data;
    const { mesh: obj2 } = obj2Data;

    // Calculate collision point and time
    const relativeVelocity = params.velocity1 - params.velocity2;
    const initialDistance = 8; // Distance between objects
    const collisionTime = Math.abs(initialDistance / relativeVelocity);

    let hasCollided = t >= collisionTime;

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
      status: hasCollided ? "After Collision" : "Before Collision",
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

    return t < 6;
  };

  // INCLINED PLANE ANIMATION
  const animateInclinedPlane = (t, params) => {
    if (!projectileRef.current || collisionObjectsRef.current.length < 1)
      return false;

    const planeData = collisionObjectsRef.current[0];
    const angleRad = planeData.angle;
    const planeLength = planeData.length;
    const planeHeight = planeData.height;

    const a = inclinedPlaneAcceleration(params.angle);
    const distance = 0.5 * a * t * t;
    const velocity = a * t;

    if (distance >= planeLength) {
      // Reached bottom
      setMeasurements({
        finalVelocity: Math.sqrt(2 * a * planeLength).toFixed(2) + " m/s",
        timeToBottom: Math.sqrt((2 * planeLength) / a).toFixed(2) + " s",
        acceleration: a.toFixed(2) + " m/s²",
      });
      return false;
    }

    // Position along incline
    const ball = projectileRef.current;
    const progress = distance / planeLength;
    const startZ = -planeLength / 2 + 0.3;
    const endZ = planeLength / 2;

    ball.position.z = startZ + progress * (endZ - startZ);
    ball.position.y = planeHeight * (1 - progress) + 0.25;

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

  // NEWTON'S CRADLE ANIMATION
  const animateCradle = (t, params) => {
    if (!pendulumRef.current?.ballsData) return false;

    const { ballsData, baseY, stringLength } = pendulumRef.current;
    if (ballsData.length === 0) return false;

    const pullBack = Math.round(params.pullBack || 1);
    const period = 1.5;
    const maxAngle = 0.5;

    ballsData.forEach((ballData, i) => {
      const { ball, string, x } = ballData;

      let angle = 0;
      if (i < pullBack) {
        // Left balls swing
        angle = maxAngle * Math.cos((2 * Math.PI * t) / period);
        if (angle < 0) angle = 0;
      } else if (i >= ballsData.length - pullBack) {
        // Right balls swing (opposite phase)
        angle = -maxAngle * Math.cos((2 * Math.PI * t) / period);
        if (angle > 0) angle = 0;
      }

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
      left_balls_swinging: pullBack,
      right_balls_swinging: pullBack,
      oscillations: (t / period).toFixed(1),
    });

    return true;
  };

  // FREE FALL ANIMATION
  const animateFreeFall = (t, params) => {
    if (!projectileRef.current || !pendulumRef.current) return false;

    const g = 9.81;
    const startHeight = pendulumRef.current.startHeight;
    const y = startHeight - 0.5 * g * t * t;
    const v = g * t;

    if (y <= 0.25) {
      projectileRef.current.position.y = 0.25;
      setMeasurements({
        final_velocity: Math.sqrt(2 * g * startHeight).toFixed(2) + " m/s",
        fall_time: t.toFixed(3) + " s",
        impact_energy: (0.5 * params.mass * v * v).toFixed(2) + " J",
      });
      return false;
    }

    projectileRef.current.position.y = y;

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

  // ATWOOD MACHINE ANIMATION
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
    const a = ((m1 - m2) * g) / (m1 + m2);

    // Distance moved
    const s = 0.5 * a * t * t;
    const v = a * t;

    // Limit movement
    const maxDrop = 3;
    if (s >= maxDrop) {
      setMeasurements({
        final_velocity: (a * Math.sqrt((2 * maxDrop) / a)).toFixed(2) + " m/s",
        distance_moved: maxDrop.toFixed(2) + " m",
        time: t.toFixed(2) + "s",
      });
      return false;
    }

    // Mass 1 goes down, Mass 2 goes up
    mass1.position.y = initialY1 - s;
    mass2.position.y = initialY2 + s;

    // Update strings
    const stringLen1 = pulleyY - mass1.position.y - 0.2;
    const stringLen2 = pulleyY - mass2.position.y - 0.2;
    string1.scaling.y = stringLen1 / 2;
    string1.position.y = pulleyY - stringLen1 / 2;
    string2.scaling.y = stringLen2 / 2;
    string2.position.y = pulleyY - stringLen2 / 2;

    // Rotate pulley
    if (pulley) {
      pulley.rotation.z = s / 0.4; // Angular rotation based on string movement
    }

    setMeasurements({
      time: t.toFixed(2) + "s",
      distance: s.toFixed(3) + " m",
      velocity: v.toFixed(3) + " m/s",
      acceleration: a.toFixed(3) + " m/s²",
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
