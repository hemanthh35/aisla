// WebAR Chemistry Lab - Augmented Reality Virtual Chemistry Lab
// Uses WebXR for phone-based AR experience with camera fallback

import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import reactionsEngine from '../utils/reactionsEngine';
import './ChemistryLabAR.css';

const ChemistryLabAR = () => {
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const xrHelperRef = useRef(null);
    const cameraRef = useRef(null);

    // State
    const [arSupported, setArSupported] = useState(null); // null = checking, true/false = result
    const [arSessionActive, setArSessionActive] = useState(false);
    const [labPlaced, setLabPlaced] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mode, setMode] = useState('free');
    const [selectedChemical, setSelectedChemical] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);
    const [safetyWarning, setSafetyWarning] = useState(null);
    const [activeReaction, setActiveReaction] = useState(null);
    const [showEquation, setShowEquation] = useState(false);
    const [resultSummary, setResultSummary] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedExperiment, setSelectedExperiment] = useState(null);
    const [showExperimentSelector, setShowExperimentSelector] = useState(false);
    const [instructions, setInstructions] = useState([]);
    const [isBurnerOn, setIsBurnerOn] = useState(false);
    const [surfaceDetected, setSurfaceDetected] = useState(false);
    const [placementIndicator, setPlacementIndicator] = useState(null);
    const [useCameraFallback, setUseCameraFallback] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    // Refs for AR state
    const selectedChemicalRef = useRef(null);
    const selectedToolRef = useRef(null);
    const labObjectsRef = useRef({});
    const isBurnerOnRef = useRef(false);
    const labAnchorRef = useRef(null);
    const hitTestSourceRef = useRef(null);

    // Sync refs with state
    useEffect(() => { selectedChemicalRef.current = selectedChemical; }, [selectedChemical]);
    useEffect(() => { selectedToolRef.current = selectedTool; }, [selectedTool]);
    useEffect(() => { isBurnerOnRef.current = isBurnerOn; }, [isBurnerOn]);

    // Chemicals list
    const chemicalsList = reactionsEngine.getAvailableChemicals();

    // Guided experiments
    const guidedExperiments = [
        {
            id: 'neutralization',
            title: 'Acid-Base Neutralization',
            description: 'Mix HCl with NaOH to observe a neutralization reaction',
            difficulty: 'Easy',
            chemicals: ['HCl', 'NaOH'],
            steps: [
                { instruction: 'Select HCl (Hydrochloric Acid) from the chemicals panel', action: 'selectChemical', target: 'HCl' },
                { instruction: 'Tap on the beaker to add HCl', action: 'addToContainer', target: 'beaker' },
                { instruction: 'Select NaOH (Sodium Hydroxide)', action: 'selectChemical', target: 'NaOH' },
                { instruction: 'Tap the same beaker to add NaOH', action: 'addToContainer', target: 'beaker' },
                { instruction: 'Observe the neutralization reaction!', action: 'observe' }
            ]
        },
        {
            id: 'precipitation',
            title: 'Silver Chloride Precipitation',
            description: 'Mix AgNO₃ with NaCl to form white precipitate',
            difficulty: 'Easy',
            chemicals: ['AgNO3', 'NaCl'],
            steps: [
                { instruction: 'Select AgNO₃ (Silver Nitrate)', action: 'selectChemical', target: 'AgNO3' },
                { instruction: 'Add it to a beaker', action: 'addToContainer', target: 'beaker' },
                { instruction: 'Select NaCl (Sodium Chloride)', action: 'selectChemical', target: 'NaCl' },
                { instruction: 'Add NaCl to form the precipitate', action: 'addToContainer', target: 'beaker' },
                { instruction: 'Observe the white precipitate forming!', action: 'observe' }
            ]
        },
        {
            id: 'gas_evolution',
            title: 'Carbon Dioxide Evolution',
            description: 'React CaCO₃ with HCl to produce CO₂ gas',
            difficulty: 'Medium',
            chemicals: ['CaCO3', 'HCl'],
            steps: [
                { instruction: 'Select CaCO₃ (Calcium Carbonate)', action: 'selectChemical', target: 'CaCO3' },
                { instruction: 'Add it to the flask', action: 'addToContainer', target: 'flask' },
                { instruction: 'Select HCl (Hydrochloric Acid)', action: 'selectChemical', target: 'HCl' },
                { instruction: 'Add HCl and watch the bubbles!', action: 'addToContainer', target: 'flask' },
                { instruction: 'Observe CO₂ gas evolving!', action: 'observe' }
            ]
        },
        {
            id: 'displacement',
            title: 'Zinc Copper Displacement',
            description: 'Displace copper from CuSO₄ using zinc',
            difficulty: 'Medium',
            chemicals: ['CuSO4', 'Zn'],
            steps: [
                { instruction: 'Select CuSO₄ (Copper Sulfate)', action: 'selectChemical', target: 'CuSO4' },
                { instruction: 'Add the blue solution to a beaker', action: 'addToContainer', target: 'beaker' },
                { instruction: 'Select Zn (Zinc Metal)', action: 'selectChemical', target: 'Zn' },
                { instruction: 'Add zinc to displace copper', action: 'addToContainer', target: 'beaker' },
                { instruction: 'Watch the color change!', action: 'observe' }
            ]
        },
        {
            id: 'golden_rain',
            title: 'Golden Rain Experiment',
            description: 'Create beautiful yellow lead iodide',
            difficulty: 'Hard',
            chemicals: ['Pb(NO3)2', 'KI'],
            steps: [
                { instruction: '⚠️ Lead compounds are toxic!', action: 'warning' },
                { instruction: 'Select Pb(NO₃)₂ (Lead Nitrate)', action: 'selectChemical', target: 'Pb(NO3)2' },
                { instruction: 'Add it to a test tube', action: 'addToContainer', target: 'testTube' },
                { instruction: 'Select KI (Potassium Iodide)', action: 'selectChemical', target: 'KI' },
                { instruction: 'Add KI for the golden precipitate!', action: 'addToContainer', target: 'testTube' },
                { instruction: 'Observe the beautiful golden rain!', action: 'observe' }
            ]
        }
    ];

    // Check AR support on mount
    useEffect(() => {
        const checkARSupport = async () => {
            if (!navigator.xr) {
                setArSupported(false);
                setIsLoading(false);
                return;
            }

            try {
                const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                setArSupported(isSupported);
            } catch (e) {
                console.log('AR support check failed:', e);
                setArSupported(false);
            }
            setIsLoading(false);
        };

        checkARSupport();
    }, []);

    // Initialize Babylon.js scene
    useEffect(() => {
        if (!canvasRef.current || arSupported === null) return;

        let engine = null;
        let scene = null;

        const initScene = async () => {
            // Create engine
            engine = new BABYLON.Engine(canvasRef.current, true, {
                preserveDrawingBuffer: true,
                stencil: true,
                xrCompatible: true
            });
            engineRef.current = engine;

            // Create scene
            scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent for AR
            sceneRef.current = scene;

            // Create camera
            const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 1.6, 0), scene);
            camera.attachControl(canvasRef.current, true);
            camera.minZ = 0.001;

            // Add ambient light for AR
            const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 0.7;

            // Add directional light for shadows
            const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), scene);
            dirLight.intensity = 0.5;

            // Create placement indicator
            const indicator = BABYLON.MeshBuilder.CreateTorus('indicator', {
                diameter: 0.3,
                thickness: 0.02,
                tessellation: 32
            }, scene);
            const indicatorMat = new BABYLON.StandardMaterial('indicatorMat', scene);
            indicatorMat.emissiveColor = new BABYLON.Color3(0.3, 0.7, 1);
            indicatorMat.alpha = 0.8;
            indicator.material = indicatorMat;
            indicator.isVisible = false;
            indicator.rotation.x = Math.PI / 2;
            setPlacementIndicator(indicator);

            // Start render loop using scene.executeWhenReady
            scene.executeWhenReady(function () {
                engine.runRenderLoop(function () {
                    scene.render();
                });
            });

            // Handle resize
            window.addEventListener('resize', () => {
                if (engine) engine.resize();
            });

            // Initialize XR if supported
            if (arSupported) {
                try {
                    const xrHelper = await scene.createDefaultXRExperienceAsync({
                        uiOptions: {
                            sessionMode: 'immersive-ar',
                            referenceSpaceType: 'local-floor'
                        },
                        optionalFeatures: true
                    });
                    xrHelperRef.current = xrHelper;

                    // Enable hit testing for surface detection
                    const hitTest = xrHelper.baseExperience.featuresManager.enableFeature(
                        BABYLON.WebXRHitTest,
                        'latest'
                    );

                    hitTest.onHitTestResultObservable.add((results) => {
                        if (results.length && !labPlaced) {
                            setSurfaceDetected(true);
                            const hitResult = results[0];
                            if (indicator && hitResult.transformationMatrix) {
                                indicator.isVisible = true;
                                hitResult.transformationMatrix.decompose(
                                    indicator.scaling,
                                    indicator.rotationQuaternion || (indicator.rotationQuaternion = new BABYLON.Quaternion()),
                                    indicator.position
                                );
                            }
                        }
                    });

                    // Handle XR session state
                    xrHelper.baseExperience.onStateChangedObservable.add((state) => {
                        if (state === BABYLON.WebXRState.IN_XR) {
                            setArSessionActive(true);
                        } else if (state === BABYLON.WebXRState.NOT_IN_XR) {
                            setArSessionActive(false);
                        }
                    });

                    // Handle tap to place lab
                    scene.onPointerDown = (evt, pickInfo) => {
                        if (arSessionActive && surfaceDetected && !labPlaced && indicator.isVisible) {
                            placeLabAtIndicator(scene, indicator.position.clone());
                        } else if (labPlaced && pickInfo.hit && pickInfo.pickedMesh?.metadata?.isClickable) {
                            handleMeshClick(pickInfo.pickedMesh);
                        }
                    };

                } catch (e) {
                    console.log('XR initialization error:', e);
                }
            }
        };

        initScene();

        return () => {
            if (engine) {
                engine.stopRenderLoop();
                engine.dispose();
            }
            if (scene) {
                scene.dispose();
            }
        };
    }, [arSupported]);

    // Place lab at indicator position
    const placeLabAtIndicator = async (scene, position) => {
        if (!scene) return;

        setLabPlaced(true);
        if (placementIndicator) {
            placementIndicator.isVisible = false;
        }

        // Create lab equipment at the position
        const labRoot = new BABYLON.TransformNode('labRoot', scene);
        labRoot.position = position;
        labRoot.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3); // Scale for AR

        const objects = {};

        // Create beakers
        for (let i = 0; i < 3; i++) {
            const beaker = await createBeaker(scene, new BABYLON.Vector3(-0.3 + i * 0.3, 0, 0), `beaker${i}`);
            beaker.parent = labRoot;
            objects[`beaker${i}`] = beaker;
        }

        // Create test tubes
        for (let i = 0; i < 3; i++) {
            const testTube = await createTestTube(scene, new BABYLON.Vector3(0.5, 0, -0.3 + i * 0.15), `testTube${i}`);
            testTube.parent = labRoot;
            objects[`testTube${i}`] = testTube;
        }

        // Create conical flask
        const flask = await createFlask(scene, new BABYLON.Vector3(-0.5, 0, 0.3));
        flask.parent = labRoot;
        objects.flask = flask;

        // Create Bunsen burner
        const burner = await createBunsenBurner(scene, new BABYLON.Vector3(0, 0, 0.4));
        burner.body.parent = labRoot;
        objects.bunsenBurner = burner;

        labObjectsRef.current = objects;
        labAnchorRef.current = labRoot;

        // Show success message
        setSafetyWarning('✅ Lab placed! Select a chemical to start');
        setTimeout(() => setSafetyWarning(null), 3000);
    };

    // Create beaker
    const createBeaker = async (scene, position, name) => {
        const beaker = BABYLON.MeshBuilder.CreateCylinder(name, {
            height: 0.2,
            diameterTop: 0.12,
            diameterBottom: 0.1,
            tessellation: 32
        }, scene);
        beaker.position = position;

        const mat = new BABYLON.PBRMaterial(`${name}Mat`, scene);
        mat.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
        mat.metallic = 0;
        mat.roughness = 0.1;
        mat.alpha = 0.4;
        beaker.material = mat;

        // Create liquid inside
        const liquid = BABYLON.MeshBuilder.CreateCylinder(`${name}Liquid`, {
            height: 0.01,
            diameter: 0.09,
            tessellation: 32
        }, scene);
        liquid.position = new BABYLON.Vector3(0, -0.08, 0);
        liquid.parent = beaker;
        liquid.isVisible = false;

        const liquidMat = new BABYLON.PBRMaterial(`${name}LiquidMat`, scene);
        liquidMat.albedoColor = new BABYLON.Color3(0.3, 0.5, 0.9);
        liquidMat.metallic = 0;
        liquidMat.roughness = 0.3;
        liquidMat.alpha = 0.7;
        liquid.material = liquidMat;

        beaker.metadata = {
            type: 'beaker',
            name: name,
            isClickable: true,
            contents: [],
            volume: 0,
            maxVolume: 200,
            liquid: liquid
        };

        return beaker;
    };

    // Create test tube
    const createTestTube = async (scene, position, name) => {
        const tube = BABYLON.MeshBuilder.CreateCylinder(name, {
            height: 0.15,
            diameter: 0.025,
            tessellation: 16
        }, scene);
        tube.position = position;

        const mat = new BABYLON.PBRMaterial(`${name}Mat`, scene);
        mat.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
        mat.metallic = 0;
        mat.roughness = 0.1;
        mat.alpha = 0.3;
        tube.material = mat;

        // Liquid
        const liquid = BABYLON.MeshBuilder.CreateCylinder(`${name}Liquid`, {
            height: 0.01,
            diameter: 0.02,
            tessellation: 16
        }, scene);
        liquid.position.y = -0.05;
        liquid.parent = tube;
        liquid.isVisible = false;

        const liquidMat = new BABYLON.PBRMaterial(`${name}LiquidMat`, scene);
        liquidMat.albedoColor = new BABYLON.Color3(0.3, 0.7, 0.3);
        liquidMat.alpha = 0.7;
        liquid.material = liquidMat;

        tube.metadata = {
            type: 'testTube',
            name: name,
            isClickable: true,
            contents: [],
            volume: 0,
            maxVolume: 50,
            liquid: liquid
        };

        return tube;
    };

    // Create conical flask
    const createFlask = async (scene, position) => {
        const flask = BABYLON.MeshBuilder.CreateCylinder('flask', {
            height: 0.18,
            diameterTop: 0.04,
            diameterBottom: 0.14,
            tessellation: 32
        }, scene);
        flask.position = position;

        const mat = new BABYLON.PBRMaterial('flaskMat', scene);
        mat.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
        mat.metallic = 0;
        mat.roughness = 0.1;
        mat.alpha = 0.35;
        flask.material = mat;

        // Liquid
        const liquid = BABYLON.MeshBuilder.CreateCylinder('flaskLiquid', {
            height: 0.01,
            diameterTop: 0.03,
            diameterBottom: 0.1,
            tessellation: 32
        }, scene);
        liquid.position.y = -0.05;
        liquid.parent = flask;
        liquid.isVisible = false;

        const liquidMat = new BABYLON.PBRMaterial('flaskLiquidMat', scene);
        liquidMat.albedoColor = new BABYLON.Color3(0.8, 0.3, 0.3);
        liquidMat.alpha = 0.7;
        liquid.material = liquidMat;

        flask.metadata = {
            type: 'flask',
            name: 'flask',
            isClickable: true,
            contents: [],
            volume: 0,
            maxVolume: 150,
            liquid: liquid
        };

        return flask;
    };

    // Create Bunsen burner
    const createBunsenBurner = async (scene, position) => {
        const body = BABYLON.MeshBuilder.CreateCylinder('burnerBody', {
            height: 0.12,
            diameterTop: 0.03,
            diameterBottom: 0.06,
            tessellation: 16
        }, scene);
        body.position = position;

        const bodyMat = new BABYLON.StandardMaterial('burnerMat', scene);
        bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
        bodyMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        body.material = bodyMat;

        // Flame
        const flame = BABYLON.MeshBuilder.CreateCylinder('flame', {
            height: 0.08,
            diameterTop: 0,
            diameterBottom: 0.03,
            tessellation: 8
        }, scene);
        flame.position.y = 0.1;
        flame.parent = body;

        const flameMat = new BABYLON.StandardMaterial('flameMat', scene);
        flameMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
        flameMat.alpha = 0.8;
        flame.material = flameMat;
        flame.isVisible = false;

        body.metadata = {
            type: 'bunsenBurner',
            name: 'bunsenBurner',
            isClickable: true
        };

        return { body, flame };
    };

    // Handle mesh click
    const handleMeshClick = async (mesh) => {
        if (!mesh.metadata) return;

        const { type, name } = mesh.metadata;
        const currentChemical = selectedChemicalRef.current;
        const currentTool = selectedToolRef.current;

        console.log('AR Clicked:', type, name, 'Chemical:', currentChemical?.name);

        // Handle Bunsen burner
        if (type === 'bunsenBurner') {
            const newState = !isBurnerOnRef.current;
            setIsBurnerOn(newState);
            isBurnerOnRef.current = newState;

            if (labObjectsRef.current.bunsenBurner?.flame) {
                labObjectsRef.current.bunsenBurner.flame.isVisible = newState;
            }
            setSafetyWarning(newState ? '🔥 Burner ON' : '❄️ Burner OFF');
            setTimeout(() => setSafetyWarning(null), 1500);
            return;
        }

        // Handle adding chemical
        if (currentChemical && ['beaker', 'testTube', 'flask'].includes(type)) {
            await addChemicalToContainer(mesh, currentChemical);
            return;
        }

        // Handle tools
        if (currentTool === 'stir' && mesh.metadata.contents?.length > 0) {
            setSafetyWarning('🥄 Stirring ' + name);
            setTimeout(() => setSafetyWarning(null), 1500);
            return;
        }

        if (currentTool === 'measure') {
            const info = mesh.metadata.contents?.length > 0
                ? `${name}: ${mesh.metadata.volume}ml`
                : `${name}: Empty`;
            setSafetyWarning(info);
            setTimeout(() => setSafetyWarning(null), 2000);
        }
    };

    // Add chemical to container
    const addChemicalToContainer = async (containerMesh, chemical) => {
        const metadata = containerMesh.metadata;

        if (metadata.volume + 50 > metadata.maxVolume) {
            setSafetyWarning('⚠️ Container would overflow!');
            setTimeout(() => setSafetyWarning(null), 2000);
            return;
        }

        // Safety check
        try {
            const existingIds = metadata.contents.map(c => c.id);
            const safety = await reactionsEngine.checkSafety([...existingIds, chemical.id]);
            if (safety.isDangerous) {
                setSafetyWarning(`⚠️ ${safety.warning || 'Dangerous combination!'}`);
                setTimeout(() => setSafetyWarning(null), 3000);
                return;
            }
        } catch (e) {
            console.log('Safety check skipped');
        }

        // Add chemical
        metadata.contents.push(chemical);
        metadata.volume += 50;

        // Update liquid visualization
        if (metadata.liquid) {
            metadata.liquid.isVisible = true;
            metadata.liquid.scaling.y = Math.max(1, metadata.volume / metadata.maxVolume * 5);
            metadata.liquid.material.albedoColor = BABYLON.Color3.FromHexString(chemical.color || '#4488ff');
        }

        setSafetyWarning(`✅ Added ${chemical.formula}`);
        setTimeout(() => setSafetyWarning(null), 1500);

        // Check for reaction
        if (metadata.contents.length >= 2) {
            try {
                const ids = metadata.contents.map(c => c.id);
                console.log('🔬 AR: Checking reaction for:', ids.join(' + '));

                const result = await reactionsEngine.calculateReaction(ids, { isHeated: isBurnerOnRef.current });

                if (result.success && result.reaction) {
                    console.log('⚗️ AR: Reaction detected!', result.reaction);
                    setActiveReaction(result.reaction);
                    setShowEquation(true);

                    // Update color
                    if (metadata.liquid && result.reaction.resultColor) {
                        setTimeout(() => {
                            metadata.liquid.material.albedoColor = BABYLON.Color3.FromHexString(result.reaction.resultColor);
                            // Scale up liquid to show reaction occurred
                            metadata.liquid.scaling.y = Math.max(metadata.liquid.scaling.y, metadata.volume / metadata.maxVolume * 8);
                        }, 500);
                    }

                    // Show safety warning if present
                    if (result.reaction.safetyWarnings && result.reaction.safetyWarnings.length > 0) {
                        setSafetyWarning(`⚠️ ${result.reaction.safetyWarnings[0]}`);
                    }

                    // Show result
                    setTimeout(() => {
                        setResultSummary({
                            equation: result.reaction.equation,
                            explanation: result.reaction.explanation,
                            type: result.reaction.type,
                            safetyWarnings: result.reaction.safetyWarnings
                        });
                    }, 1000);
                } else if (result.noReaction) {
                    // EXPLICIT "No Reaction" feedback
                    console.log('❌ AR: No reaction between:', ids.join(' + '));
                    setSafetyWarning(`ℹ️ ${result.message || 'No reaction occurs.'}`);
                    setResultSummary({
                        equation: ids.join(' + ') + ' → No Reaction',
                        explanation: result.message || 'These chemicals do not react under current conditions.',
                        type: 'no_reaction'
                    });
                    setTimeout(() => setSafetyWarning(null), 4000);
                } else if (result.error === 'requires_heat') {
                    setSafetyWarning('🔥 Needs heat! Tap the burner.');
                    setTimeout(() => setSafetyWarning(null), 4000);
                } else if (result.error === 'dangerous_combination') {
                    setSafetyWarning(result.warning);
                    setTimeout(() => setSafetyWarning(null), 5000);
                }
            } catch (e) {
                console.error('AR Reaction check error:', e);
                setSafetyWarning('⚠️ Error checking reaction');
                setTimeout(() => setSafetyWarning(null), 3000);
            }
        }

        setSelectedChemical(null);
        selectedChemicalRef.current = null;
    };

    // Enter AR mode
    const enterAR = async () => {
        // Check if we're on HTTPS (required for AR)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            setSafetyWarning('⚠️ AR requires HTTPS! Use DevTunnels or ngrok.');
            setTimeout(() => setSafetyWarning(null), 5000);
            return;
        }

        if (xrHelperRef.current) {
            try {
                await xrHelperRef.current.baseExperience.enterXRAsync('immersive-ar', 'local-floor');
            } catch (e) {
                console.error('Failed to enter AR:', e);
                let errorMsg = 'Failed to enter AR mode. ';
                if (e.message?.includes('NotSupportedError')) {
                    errorMsg += 'AR not supported on this device.';
                } else if (e.message?.includes('SecurityError')) {
                    errorMsg += 'HTTPS required for AR.';
                } else {
                    errorMsg += e.message || 'Unknown error.';
                }
                setSafetyWarning(errorMsg);
                setTimeout(() => setSafetyWarning(null), 5000);
            }
        } else {
            setSafetyWarning('AR not initialized. Try refreshing the page.');
            setTimeout(() => setSafetyWarning(null), 3000);
        }
    };

    // Camera fallback mode - works on all phones
    const startCameraFallback = async () => {
        try {
            // Request camera access
            const constraints = {
                video: {
                    facingMode: 'environment', // Back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setUseCameraFallback(true);
            setCameraReady(true);
            setArSessionActive(true);

            // Initialize the 3D scene with camera background
            await initFallbackScene();

            setSafetyWarning('📷 Camera mode active! Tap screen to place lab.');
            setTimeout(() => setSafetyWarning(null), 3000);

        } catch (e) {
            console.error('Camera access denied:', e);
            setSafetyWarning('❌ Camera access denied. Please allow camera permission.');
            setTimeout(() => setSafetyWarning(null), 4000);
        }
    };

    // Initialize fallback 3D scene
    const initFallbackScene = async () => {
        const scene = sceneRef.current;
        if (!scene) {
            console.error('Scene not initialized for fallback mode');
            setSafetyWarning('❌ Failed to initialize scene');
            setTimeout(() => setSafetyWarning(null), 3000);
            return;
        }

        // Set transparent background to show camera video
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

        // Setup click handler for camera fallback mode
        scene.onPointerDown = (evt, pickInfo) => {
            if (pickInfo.hit && pickInfo.pickedMesh?.metadata?.isClickable) {
                handleMeshClick(pickInfo.pickedMesh);
            }
        };

        // Place lab automatically in center
        try {
            await placeLabAtIndicator(scene, new BABYLON.Vector3(0, -0.5, 2));
            console.log('✅ Lab placed in camera fallback mode');
        } catch (e) {
            console.error('Failed to place lab:', e);
            setSafetyWarning('❌ Failed to place lab');
            setTimeout(() => setSafetyWarning(null), 3000);
            return;
        }

        // Enable device orientation for gyroscope control
        if (window.DeviceOrientationEvent) {
            // Request permission on iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        window.addEventListener('deviceorientation', handleDeviceOrientation);
                    }
                } catch (e) {
                    console.log('Gyroscope permission denied');
                }
            } else {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
        }

        // Add touch controls for rotation/zoom
        setupTouchControls();
    };

    // Handle device orientation for gyroscope
    const handleDeviceOrientation = (event) => {
        const camera = cameraRef.current;
        if (!camera || !labAnchorRef.current) return;

        const alpha = event.alpha || 0; // Z-axis rotation
        const beta = event.beta || 0;   // X-axis rotation
        const gamma = event.gamma || 0; // Y-axis rotation

        // Subtle rotation based on device tilt
        labAnchorRef.current.rotation.y = (alpha * Math.PI / 180) * 0.1;
        labAnchorRef.current.rotation.x = ((beta - 90) * Math.PI / 180) * 0.05;
    };

    // Touch controls for the lab
    const setupTouchControls = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let lastTouchX = 0;
        let lastTouchY = 0;
        let pinchDistance = 0;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Pinch zoom
                pinchDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            if (!labAnchorRef.current) return;

            if (e.touches.length === 1) {
                // Rotate lab
                const deltaX = e.touches[0].clientX - lastTouchX;
                const deltaY = e.touches[0].clientY - lastTouchY;

                labAnchorRef.current.rotation.y += deltaX * 0.01;
                labAnchorRef.current.rotation.x += deltaY * 0.005;

                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Pinch to scale
                const newDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );

                const scale = newDistance / pinchDistance;
                const newScale = Math.max(0.2, Math.min(1, labAnchorRef.current.scaling.x * scale));
                labAnchorRef.current.scaling = new BABYLON.Vector3(newScale, newScale, newScale);

                pinchDistance = newDistance;
            }
        });
    };

    // Stop camera
    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setUseCameraFallback(false);
        setCameraReady(false);
        setArSessionActive(false);
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };

    // Reset lab
    const resetLab = () => {
        Object.values(labObjectsRef.current).forEach(obj => {
            if (obj.metadata) {
                obj.metadata.contents = [];
                obj.metadata.volume = 0;
                if (obj.metadata.liquid) {
                    obj.metadata.liquid.isVisible = false;
                }
            }
        });

        if (labObjectsRef.current.bunsenBurner?.flame) {
            labObjectsRef.current.bunsenBurner.flame.isVisible = false;
        }

        setIsBurnerOn(false);
        setSelectedChemical(null);
        setSelectedTool(null);
        setActiveReaction(null);
        setShowEquation(false);
        setResultSummary(null);
        setSafetyWarning('🔄 Lab reset');
        setTimeout(() => setSafetyWarning(null), 1500);
    };

    // Chemical select
    const handleChemicalSelect = (chemical) => {
        setSelectedChemical(chemical);
        selectedChemicalRef.current = chemical;
        setSelectedTool(null);
    };

    // Tool select
    const handleToolSelect = (tool) => {
        setSelectedTool(tool);
        setSelectedChemical(null);
        selectedChemicalRef.current = null;
    };

    // Experiment select
    const handleExperimentSelect = (exp) => {
        setSelectedExperiment(exp);
        setInstructions(exp.steps);
        setCurrentStep(0);
        setShowExperimentSelector(false);
        resetLab();
    };

    // Step navigation
    const handleNextStep = () => {
        if (currentStep < instructions.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Mode change
    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === 'guided') {
            setShowExperimentSelector(true);
        } else {
            setSelectedExperiment(null);
            setInstructions([]);
            setCurrentStep(0);
        }
    };

    // Render loading state
    if (isLoading) {
        return (
            <div className="ar-lab loading">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <h2>Checking AR Support...</h2>
                    <p>Please wait while we check your device</p>
                </div>
            </div>
        );
    }

    // Render AR not supported
    if (arSupported === false) {
        return (
            <div className="ar-lab not-supported">
                <div className="not-supported-content">
                    <div className="icon">📱</div>
                    <h2>AR Not Supported</h2>
                    <p>Your device or browser doesn't support WebXR AR.</p>
                    <div className="requirements">
                        <h3>Requirements:</h3>
                        <ul>
                            <li>Android phone with ARCore support</li>
                            <li>OR iPhone with ARKit support</li>
                            <li>Chrome browser (Android) or Safari (iOS)</li>
                            <li>HTTPS connection</li>
                        </ul>
                    </div>
                    <a href="/chemistry-lab" className="fallback-btn">
                        Use Standard 3D Lab Instead
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="ar-lab">
            {/* Camera Video Background (fallback mode) */}
            {useCameraFallback && (
                <video
                    ref={videoRef}
                    className="camera-background"
                    playsInline
                    muted
                    autoPlay
                />
            )}

            {/* AR Canvas */}
            <canvas ref={canvasRef} className={`ar-canvas ${useCameraFallback ? 'transparent' : ''}`} />

            {/* Safety Warning */}
            {safetyWarning && (
                <div className="ar-safety-warning">
                    <span>{safetyWarning}</span>
                </div>
            )}

            {/* Selection Indicator */}
            {(selectedChemical || selectedTool) && (
                <div className="ar-selection-indicator">
                    {selectedChemical && (
                        <span>🧪 {selectedChemical.formula} → Tap container</span>
                    )}
                    {selectedTool && (
                        <span>🔧 {selectedTool} mode</span>
                    )}
                    <button onClick={() => {
                        setSelectedChemical(null);
                        selectedChemicalRef.current = null;
                        setSelectedTool(null);
                    }}>✕</button>
                </div>
            )}

            {/* Enter AR / Camera Mode Button */}
            {!arSessionActive && (
                <div className="ar-enter-overlay">
                    <div className="ar-enter-content">
                        <div className="ar-icon">🔬</div>
                        <h2>AR Chemistry Lab</h2>
                        <p>Experience chemistry in augmented reality</p>

                        {/* WebXR AR Button - only if supported */}
                        {arSupported && (
                            <button className="enter-ar-btn" onClick={enterAR}>
                                <span className="ar-camera-icon">🥽</span>
                                Enter Full AR Mode
                            </button>
                        )}

                        {/* Camera Fallback - always available */}
                        <button className="enter-ar-btn camera-mode" onClick={startCameraFallback}>
                            <span className="ar-camera-icon">📷</span>
                            {arSupported ? 'Use Camera Mode' : 'Start Camera Mode'}
                        </button>

                        {!arSupported && (
                            <p className="ar-notice">
                                Full AR not supported on this device.<br />
                                Camera mode works on all phones!
                            </p>
                        )}

                        <a href="/chemistry-lab" className="fallback-link">
                            Or use standard 3D lab
                        </a>
                    </div>
                </div>
            )}

            {/* AR Session Active UI */}
            {arSessionActive && (
                <>
                    {/* Placement Instructions */}
                    {!labPlaced && (
                        <div className="ar-placement-instructions">
                            <div className="instruction-box">
                                {!surfaceDetected ? (
                                    <>
                                        <div className="scan-icon">📡</div>
                                        <p>Point camera at a flat surface</p>
                                        <span className="hint">Table, desk, or floor</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="tap-icon">👆</div>
                                        <p>Tap to place the lab</p>
                                        <span className="hint">You'll see a blue ring</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lab Controls (after placement) */}
                    {labPlaced && (
                        <>
                            {/* Top Bar */}
                            <div className="ar-topbar">
                                <div className="ar-title">
                                    <span>🧪 AR Chemistry Lab</span>
                                </div>
                                <div className="ar-mode-toggle">
                                    <button
                                        className={mode === 'free' ? 'active' : ''}
                                        onClick={() => handleModeChange('free')}
                                    >
                                        Free
                                    </button>
                                    <button
                                        className={mode === 'guided' ? 'active' : ''}
                                        onClick={() => handleModeChange('guided')}
                                    >
                                        Guided
                                    </button>
                                </div>
                                <button className="ar-reset-btn" onClick={resetLab}>
                                    🔄
                                </button>
                            </div>

                            {/* Left Panel - Chemicals */}
                            <div className="ar-chemicals-panel">
                                <div className="panel-header">Chemicals</div>
                                <div className="chemicals-scroll">
                                    {chemicalsList.map(chem => (
                                        <div
                                            key={chem.id}
                                            className={`ar-chemical-item ${selectedChemical?.id === chem.id ? 'selected' : ''} ${chem.hazard}`}
                                            onClick={() => handleChemicalSelect(chem)}
                                        >
                                            <div className="chem-color" style={{ backgroundColor: chem.color }}></div>
                                            <span className="chem-formula">{chem.formula}</span>
                                            <span className={`hazard ${chem.hazard}`}>
                                                {chem.hazard === 'danger' ? '⚠️' : chem.hazard === 'warning' ? '⚡' : '✓'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Panel - Tools */}
                            <div className="ar-tools-panel">
                                <div className="panel-header">Tools</div>
                                <button
                                    className={`ar-tool-btn ${isBurnerOn ? 'active' : ''}`}
                                    onClick={() => {
                                        if (labObjectsRef.current.bunsenBurner) {
                                            const newState = !isBurnerOn;
                                            setIsBurnerOn(newState);
                                            isBurnerOnRef.current = newState;
                                            labObjectsRef.current.bunsenBurner.flame.isVisible = newState;
                                        }
                                    }}
                                >
                                    🔥 {isBurnerOn ? 'ON' : 'Burner'}
                                </button>
                                <button
                                    className={`ar-tool-btn ${selectedTool === 'stir' ? 'active' : ''}`}
                                    onClick={() => handleToolSelect('stir')}
                                >
                                    🥄 Stir
                                </button>
                                <button
                                    className={`ar-tool-btn ${selectedTool === 'measure' ? 'active' : ''}`}
                                    onClick={() => handleToolSelect('measure')}
                                >
                                    📏 Measure
                                </button>
                            </div>

                            {/* Bottom Panel - Instructions */}
                            {mode === 'guided' && selectedExperiment && (
                                <div className="ar-instructions-panel">
                                    <div className="instruction-header">
                                        <span>{selectedExperiment.title}</span>
                                        <span className="step-count">
                                            {currentStep + 1}/{instructions.length}
                                        </span>
                                    </div>
                                    <p className="instruction-text">
                                        {instructions[currentStep]?.instruction}
                                    </p>
                                    <div className="instruction-nav">
                                        <button onClick={handlePrevStep} disabled={currentStep === 0}>
                                            ← Prev
                                        </button>
                                        <button onClick={handleNextStep} disabled={currentStep >= instructions.length - 1}>
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Equation Popup */}
            {showEquation && activeReaction && (
                <div className="ar-equation-popup">
                    <button className="close-btn" onClick={() => setShowEquation(false)}>✕</button>
                    <h3>⚗️ Reaction!</h3>
                    <div className="equation">{activeReaction.equation}</div>
                    <div className="reaction-type">{activeReaction.type}</div>
                </div>
            )}

            {/* Result Summary Modal */}
            {resultSummary && (
                <div className={`ar-result-modal ${resultSummary.type === 'no_reaction' ? 'no-reaction' : ''}`}>
                    <div className="result-content">
                        <button className="close-btn" onClick={() => setResultSummary(null)}>✕</button>
                        <div className="result-icon">
                            {resultSummary.type === 'no_reaction' ? '🔬' : '⚗️'}
                        </div>
                        <h2>{resultSummary.type === 'no_reaction' ? 'No Reaction' : 'Reaction Complete!'}</h2>
                        <div className="result-equation">{resultSummary.equation}</div>
                        <p className="result-explanation">{resultSummary.explanation}</p>
                        {resultSummary.type !== 'no_reaction' && (
                            <div className="result-type">Type: {resultSummary.type?.replace('_', ' ')}</div>
                        )}
                        {resultSummary.safetyWarnings && resultSummary.safetyWarnings.length > 0 && (
                            <div className="result-safety">
                                <strong>⚠️ Safety:</strong>
                                <ul>
                                    {resultSummary.safetyWarnings.map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button className="continue-btn" onClick={() => setResultSummary(null)}>
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Experiment Selector Modal */}
            {showExperimentSelector && (
                <div className="ar-experiment-modal">
                    <div className="modal-content">
                        <button className="close-btn" onClick={() => setShowExperimentSelector(false)}>✕</button>
                        <h2>🧪 Choose Experiment</h2>
                        <div className="experiments-list">
                            {guidedExperiments.map(exp => (
                                <div
                                    key={exp.id}
                                    className="experiment-card"
                                    onClick={() => handleExperimentSelect(exp)}
                                >
                                    <div className="exp-header">
                                        <h3>{exp.title}</h3>
                                        <span className={`difficulty ${exp.difficulty.toLowerCase()}`}>
                                            {exp.difficulty}
                                        </span>
                                    </div>
                                    <p>{exp.description}</p>
                                    <div className="exp-chems">
                                        {exp.chemicals.map(c => (
                                            <span key={c} className="chem-tag">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChemistryLabAR;
