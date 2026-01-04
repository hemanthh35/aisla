// Virtual Chemistry Lab - Main 3D Scene Component
import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { GridMaterial } from '@babylonjs/materials';
import reactionsEngine from '../utils/reactionsEngine';
import { mixColors, getParticleParams } from '../utils/physics';
import './ChemistryLab.css';

const ChemistryLab = () => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [mode, setMode] = useState('free'); // 'free' or 'guided'
    const [selectedTool, setSelectedTool] = useState(null);
    const [selectedChemical, setSelectedChemical] = useState(null);
    const [containers, setContainers] = useState({});
    const [activeReaction, setActiveReaction] = useState(null);
    const [showEquation, setShowEquation] = useState(false);
    const [safetyWarning, setSafetyWarning] = useState(null);
    const [instructions, setInstructions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [experiments, setExperiments] = useState([]);
    const [selectedExperiment, setSelectedExperiment] = useState(null);
    const [labObjects, setLabObjects] = useState({});
    const [isBurnerOn, setIsBurnerOn] = useState(false);
    const [resultSummary, setResultSummary] = useState(null);
    const [showInstructions, setShowInstructions] = useState(true);
    const [chemicalsList] = useState(reactionsEngine.getAvailableChemicals());
    const [toolsList] = useState(reactionsEngine.getAvailableApparatus());
    const [showExperimentSelector, setShowExperimentSelector] = useState(false);

    // Refs to store current state values (needed for click handler closures)
    const selectedChemicalRef = useRef(null);
    const selectedToolRef = useRef(null);
    const labObjectsRef = useRef({});
    const isBurnerOnRef = useRef(false);

    // Keep refs in sync with state
    useEffect(() => { selectedChemicalRef.current = selectedChemical; }, [selectedChemical]);
    useEffect(() => { selectedToolRef.current = selectedTool; }, [selectedTool]);
    useEffect(() => { labObjectsRef.current = labObjects; }, [labObjects]);
    useEffect(() => { isBurnerOnRef.current = isBurnerOn; }, [isBurnerOn]);

    // Predefined guided experiments
    const guidedExperiments = [
        {
            id: 'neutralization',
            title: 'Acid-Base Neutralization',
            description: 'Mix HCl with NaOH to observe a neutralization reaction',
            difficulty: 'Easy',
            chemicals: ['HCl', 'NaOH'],
            steps: [
                { instruction: 'Select HCl (Hydrochloric Acid) from the chemicals panel', action: 'selectChemical', target: 'HCl' },
                { instruction: 'Click on the first beaker to add HCl', action: 'addToContainer', target: 'beaker1' },
                { instruction: 'Select NaOH (Sodium Hydroxide) from the chemicals panel', action: 'selectChemical', target: 'NaOH' },
                { instruction: 'Click on the same beaker to add NaOH and observe the neutralization reaction', action: 'addToContainer', target: 'beaker1' },
                { instruction: 'Observe the reaction! HCl + NaOH → NaCl + H₂O', action: 'observe' }
            ]
        },
        {
            id: 'precipitation',
            title: 'Silver Chloride Precipitation',
            description: 'Mix AgNO₃ with NaCl to form a white precipitate',
            difficulty: 'Easy',
            chemicals: ['AgNO3', 'NaCl'],
            steps: [
                { instruction: 'Select AgNO₃ (Silver Nitrate) from the chemicals panel', action: 'selectChemical', target: 'AgNO3' },
                { instruction: 'Click on a beaker to add Silver Nitrate solution', action: 'addToContainer', target: 'beaker2' },
                { instruction: 'Select NaCl (Sodium Chloride) from the chemicals panel', action: 'selectChemical', target: 'NaCl' },
                { instruction: 'Add NaCl to the same beaker to form a white precipitate', action: 'addToContainer', target: 'beaker2' },
                { instruction: 'Observe the white precipitate of Silver Chloride (AgCl) forming!', action: 'observe' }
            ]
        },
        {
            id: 'gas_evolution',
            title: 'Carbon Dioxide Evolution',
            description: 'React CaCO₃ with HCl to produce CO₂ gas',
            difficulty: 'Medium',
            chemicals: ['CaCO3', 'HCl'],
            steps: [
                { instruction: 'Select CaCO₃ (Calcium Carbonate/Limestone) from the chemicals panel', action: 'selectChemical', target: 'CaCO3' },
                { instruction: 'Add it to the conical flask', action: 'addToContainer', target: 'flask1' },
                { instruction: 'Select HCl (Hydrochloric Acid)', action: 'selectChemical', target: 'HCl' },
                { instruction: 'Add HCl to the flask and watch the bubbles!', action: 'addToContainer', target: 'flask1' },
                { instruction: 'Observe CO₂ gas bubbling! CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑', action: 'observe' }
            ]
        },
        {
            id: 'copper_displacement',
            title: 'Zinc Copper Displacement',
            description: 'Displace copper from CuSO₄ using zinc metal',
            difficulty: 'Medium',
            chemicals: ['CuSO4', 'Zn'],
            steps: [
                { instruction: 'Select CuSO₄ (Copper Sulfate) - the blue solution', action: 'selectChemical', target: 'CuSO4' },
                { instruction: 'Add it to a beaker', action: 'addToContainer', target: 'beaker3' },
                { instruction: 'Select Zn (Zinc Metal)', action: 'selectChemical', target: 'Zn' },
                { instruction: 'Add zinc to the copper sulfate solution', action: 'addToContainer', target: 'beaker3' },
                { instruction: 'Watch the color change! Zinc displaces copper: Zn + CuSO₄ → ZnSO₄ + Cu', action: 'observe' }
            ]
        },
        {
            id: 'lead_iodide',
            title: 'Golden Rain Experiment',
            description: 'Create beautiful yellow lead iodide precipitate',
            difficulty: 'Hard',
            chemicals: ['Pb(NO3)2', 'KI'],
            steps: [
                { instruction: '⚠️ CAUTION: Lead compounds are toxic! Handle with care.', action: 'warning' },
                { instruction: 'Select Pb(NO₃)₂ (Lead Nitrate) from the chemicals', action: 'selectChemical', target: 'Pb(NO3)2' },
                { instruction: 'Add it to a test tube', action: 'addToContainer', target: 'testTube0' },
                { instruction: 'Select KI (Potassium Iodide)', action: 'selectChemical', target: 'KI' },
                { instruction: 'Add KI to form the beautiful yellow precipitate!', action: 'addToContainer', target: 'testTube0' },
                { instruction: 'Observe the golden yellow PbI₂ precipitate! This is called "Golden Rain"', action: 'observe' }
            ]
        }
    ];

    // Ref to store click handler (avoids initialization order issues)
    const clickHandlerRef = useRef(null);

    // Initialize Babylon.js scene
    useEffect(() => {
        if (!canvasRef.current) return;

        let engine = null;
        let scene = null;

        const initScene = async () => {
            // Create engine
            engine = new BABYLON.Engine(canvasRef.current, true, {
                preserveDrawingBuffer: true,
                stencil: true
            });
            engineRef.current = engine;

            // Create scene
            scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);
            sceneRef.current = scene;

            // Create camera with orbit controls
            const camera = new BABYLON.ArcRotateCamera(
                'camera',
                -Math.PI / 2,
                Math.PI / 3,
                8,
                new BABYLON.Vector3(0, 1, 0),
                scene
            );
            camera.attachControl(canvasRef.current, true);
            camera.lowerRadiusLimit = 3;
            camera.upperRadiusLimit = 15;
            camera.lowerBetaLimit = 0.1;
            camera.upperBetaLimit = Math.PI / 2 - 0.1;
            camera.wheelPrecision = 20;
            camera.panningSensibility = 100;

            // Lighting
            const hemisphericLight = new BABYLON.HemisphericLight(
                'hemiLight',
                new BABYLON.Vector3(0, 1, 0),
                scene
            );
            hemisphericLight.intensity = 0.6;
            hemisphericLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);

            const spotLight = new BABYLON.SpotLight(
                'spotLight',
                new BABYLON.Vector3(0, 5, 0),
                new BABYLON.Vector3(0, -1, 0),
                Math.PI / 3,
                2,
                scene
            );
            spotLight.intensity = 0.8;
            spotLight.diffuse = new BABYLON.Color3(1, 0.98, 0.95);

            // Enable shadows
            const shadowGenerator = new BABYLON.ShadowGenerator(1024, spotLight);
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurKernel = 32;

            // Create lab environment
            await createLabEnvironment(scene, shadowGenerator);

            // Create lab equipment
            const objects = await createLabEquipment(scene, shadowGenerator);
            setLabObjects(objects);
            labObjectsRef.current = objects;

            // Function to handle adding chemical (MUST be defined before onPointerDown)
            const handleAddChemical = async (containerMesh, chemical) => {
                const metadata = containerMesh.metadata;

                if (metadata.volume + 50 > metadata.maxVolume) {
                    setSafetyWarning('Container would overflow! Use a larger container.');
                    setTimeout(() => setSafetyWarning(null), 3000);
                    return;
                }

                try {
                    const existingChemicals = metadata.contents.map(c => c.id);
                    const safetyCheck = await reactionsEngine.checkSafety([...existingChemicals, chemical.id]);

                    if (safetyCheck.isDangerous) {
                        setSafetyWarning(safetyCheck.warning || 'Dangerous combination!');
                        setTimeout(() => setSafetyWarning(null), 5000);
                        return;
                    }
                } catch (e) {
                    console.log('Safety check skipped');
                }

                // Add chemical to container
                metadata.contents.push(chemical);
                metadata.volume += 50;
                console.log('✅ Added', chemical.name, 'to', containerMesh.name, 'Volume:', metadata.volume);

                // Update liquid visualization
                if (metadata.liquid) {
                    metadata.liquid.isVisible = true;
                    metadata.liquid.scaling.y = Math.max(1, metadata.volume / metadata.maxVolume * 10);
                    metadata.liquid.position.y = containerMesh.position.y - 0.15 + (metadata.volume / metadata.maxVolume * 0.15);
                    metadata.liquid.material.albedoColor = BABYLON.Color3.FromHexString(chemical.color || '#4488ff');
                }

                setSafetyWarning(`Added ${chemical.formula} to ${containerMesh.name}`);
                setTimeout(() => setSafetyWarning(null), 2000);

                // Check for reaction
                if (metadata.contents.length >= 2) {
                    try {
                        const chemicalIds = metadata.contents.map(c => c.id);
                        const result = await reactionsEngine.calculateReaction(chemicalIds, { isHeated: isBurnerOnRef.current });

                        if (result.success && result.reaction) {
                            console.log('⚗️ Reaction detected!', result.reaction);
                            setActiveReaction(result.reaction);
                            setShowEquation(true);

                            // Update color to result
                            if (metadata.liquid && result.reaction.resultColor) {
                                setTimeout(() => {
                                    metadata.liquid.material.albedoColor = BABYLON.Color3.FromHexString(result.reaction.resultColor);
                                }, 500);
                            }

                            // Show result
                            setTimeout(() => {
                                setResultSummary({
                                    equation: result.reaction.equation,
                                    explanation: result.reaction.explanation,
                                    type: result.reaction.type
                                });
                            }, 1000);
                        }
                    } catch (e) {
                        console.log('Reaction check skipped:', e);
                    }
                }

                // Clear selected chemical
                setSelectedChemical(null);
                selectedChemicalRef.current = null;
            };

            // Enable picking - directly handle clicks using refs for current state
            scene.onPointerDown = (evt, pickInfo) => {
                if (!pickInfo.hit || !pickInfo.pickedMesh) return;

                const mesh = pickInfo.pickedMesh;
                if (!mesh.metadata?.isClickable) return;

                const { type, name } = mesh.metadata;
                const currentChemical = selectedChemicalRef.current;
                const currentTool = selectedToolRef.current;
                const currentLabObjects = labObjectsRef.current;
                const burnerOn = isBurnerOnRef.current;

                console.log('🖱️ Clicked:', type, name);
                console.log('📦 Current chemical:', currentChemical?.name);
                console.log('🔧 Current tool:', currentTool);

                // Handle Bunsen Burner click
                if (type === 'bunsenBurner') {
                    const newBurnerState = !burnerOn;
                    setIsBurnerOn(newBurnerState);
                    isBurnerOnRef.current = newBurnerState;
                    if (currentLabObjects.bunsenBurner?.flame) {
                        currentLabObjects.bunsenBurner.flame.isVisible = newBurnerState;
                    }
                    console.log('🔥 Burner toggled:', newBurnerState ? 'ON' : 'OFF');
                    return;
                }

                // Handle adding chemical to container
                if (currentChemical && (type === 'beaker' || type === 'testTube' || type === 'flask' || type === 'measuringCylinder')) {
                    console.log('🧪 Adding chemical to container:', name);
                    handleAddChemical(mesh, currentChemical);
                    return;
                }

                // Handle pouring
                if (currentTool === 'pour' && mesh.metadata.contents?.length > 0) {
                    console.log('💧 Pouring from:', name);
                    setContainers(prev => ({ ...prev, [name]: mesh }));
                    setSafetyWarning('Select another container to pour into');
                    setTimeout(() => setSafetyWarning(null), 3000);
                    return;
                }

                // Handle stirring
                if (currentTool === 'stir' && mesh.metadata.contents?.length > 0) {
                    console.log('🥄 Stirring:', name);
                    setSafetyWarning('Stirring ' + name + '...');
                    setTimeout(() => setSafetyWarning(null), 1500);
                    return;
                }

                // Handle measuring
                if (currentTool === 'measure') {
                    const info = mesh.metadata.contents?.length > 0
                        ? `${name}: ${mesh.metadata.volume}ml of ${mesh.metadata.contents.map(c => c.formula).join(' + ')}`
                        : `${name}: Empty`;
                    setSafetyWarning(info);
                    setTimeout(() => setSafetyWarning(null), 3000);
                    return;
                }
            };

            // Start render loop using scene.executeWhenReady
            scene.executeWhenReady(function () {
                engine.runRenderLoop(function () {
                    scene.render();
                });
            });

            // Handle resize
            const handleResize = () => {
                if (engine) {
                    engine.resize();
                }
            };
            window.addEventListener('resize', handleResize);

            setIsLoading(false);

            // Seed reactions data
            try {
                await reactionsEngine.seedReactions();
                await reactionsEngine.fetchReactions();
            } catch (err) {
                console.log('Reactions fetch error:', err);
            }
        };

        initScene();

        // Cleanup
        return () => {
            if (engine) {
                engine.stopRenderLoop();
                engine.dispose();
            }
            if (scene) {
                scene.dispose();
            }
            engineRef.current = null;
            sceneRef.current = null;
        };
    }, []); // Empty dependency array - runs once on mount

    // Create lab environment (table, walls, floor)
    const createLabEnvironment = async (scene, shadowGenerator) => {
        // Floor with grid
        const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 20, height: 20 }, scene);
        const floorMaterial = new GridMaterial('floorMat', scene);
        floorMaterial.mainColor = new BABYLON.Color3(0.15, 0.15, 0.2);
        floorMaterial.lineColor = new BABYLON.Color3(0.3, 0.3, 0.4);
        floorMaterial.gridRatio = 1;
        floor.material = floorMaterial;
        floor.receiveShadows = true;

        // Lab table
        const tableTop = BABYLON.MeshBuilder.CreateBox('tableTop', { width: 6, height: 0.1, depth: 3 }, scene);
        tableTop.position.y = 1;
        const tableMaterial = new BABYLON.PBRMaterial('tableMat', scene);
        tableMaterial.albedoColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        tableMaterial.metallic = 0.1;
        tableMaterial.roughness = 0.8;
        tableTop.material = tableMaterial;
        tableTop.receiveShadows = true;
        shadowGenerator.addShadowCaster(tableTop);

        // Table legs
        const legPositions = [
            { x: -2.8, z: -1.3 },
            { x: 2.8, z: -1.3 },
            { x: -2.8, z: 1.3 },
            { x: 2.8, z: 1.3 }
        ];

        legPositions.forEach((pos, i) => {
            const leg = BABYLON.MeshBuilder.CreateCylinder(`leg${i}`, { height: 1, diameter: 0.1 }, scene);
            leg.position = new BABYLON.Vector3(pos.x, 0.5, pos.z);
            leg.material = tableMaterial;
            shadowGenerator.addShadowCaster(leg);
        });

        // Back wall with shelves
        const backWall = BABYLON.MeshBuilder.CreateBox('backWall', { width: 8, height: 4, depth: 0.2 }, scene);
        backWall.position = new BABYLON.Vector3(0, 2, -3);
        const wallMaterial = new BABYLON.PBRMaterial('wallMat', scene);
        wallMaterial.albedoColor = new BABYLON.Color3(0.9, 0.9, 0.92);
        wallMaterial.metallic = 0;
        wallMaterial.roughness = 0.9;
        backWall.material = wallMaterial;

        // Shelf
        const shelf = BABYLON.MeshBuilder.CreateBox('shelf', { width: 5, height: 0.1, depth: 0.5 }, scene);
        shelf.position = new BABYLON.Vector3(0, 2.5, -2.7);
        shelf.material = tableMaterial;
        shadowGenerator.addShadowCaster(shelf);

        // Chemical bottles on shelf (decorative)
        for (let i = 0; i < 5; i++) {
            const bottle = BABYLON.MeshBuilder.CreateCylinder(`shelfBottle${i}`, { height: 0.4, diameter: 0.15 }, scene);
            bottle.position = new BABYLON.Vector3(-2 + i * 1, 2.75, -2.7);
            const bottleMat = new BABYLON.PBRMaterial(`bottleMat${i}`, scene);
            const colors = ['#8B4513', '#2E8B57', '#4169E1', '#DC143C', '#9932CC'];
            const color = BABYLON.Color3.FromHexString(colors[i]);
            bottleMat.albedoColor = color;
            bottleMat.metallic = 0.1;
            bottleMat.roughness = 0.3;
            bottleMat.alpha = 0.8;
            bottle.material = bottleMat;
        }
    };

    // Create lab equipment
    const createLabEquipment = async (scene, shadowGenerator) => {
        const equipment = {};

        // Create beakers
        equipment.beaker1 = createBeaker(scene, 'beaker1', new BABYLON.Vector3(-1.5, 1.2, 0), 0.3, shadowGenerator);
        equipment.beaker2 = createBeaker(scene, 'beaker2', new BABYLON.Vector3(-0.5, 1.2, 0), 0.3, shadowGenerator);
        equipment.beaker3 = createBeaker(scene, 'beaker3', new BABYLON.Vector3(0.5, 1.2, 0), 0.3, shadowGenerator);

        // Create test tubes in rack
        const rackPos = new BABYLON.Vector3(1.5, 1.1, 0.5);
        equipment.testTubeRack = createTestTubeRack(scene, rackPos, shadowGenerator);

        // Create conical flask
        equipment.flask = createConicalFlask(scene, 'flask1', new BABYLON.Vector3(-2, 1.2, -0.8), shadowGenerator);

        // Create Bunsen burner
        equipment.bunsenBurner = createBunsenBurner(scene, new BABYLON.Vector3(2, 1.05, -0.5), shadowGenerator);

        // Create tripod stand
        equipment.tripod = createTripodStand(scene, new BABYLON.Vector3(2, 1.05, -0.5), shadowGenerator);

        // Create measuring cylinder
        equipment.measuringCylinder = createMeasuringCylinder(scene, new BABYLON.Vector3(-2.3, 1.2, 0.5), shadowGenerator);

        // Create stirring rod
        equipment.stirringRod = createStirringRod(scene, new BABYLON.Vector3(0, 1.15, 0.8), shadowGenerator);

        return equipment;
    };

    // Create a glass beaker
    const createBeaker = (scene, name, position, radius, shadowGenerator) => {
        // Outer glass
        const beaker = BABYLON.MeshBuilder.CreateCylinder(name, {
            height: 0.4,
            diameterTop: radius * 2,
            diameterBottom: radius * 1.8,
            tessellation: 32
        }, scene);
        beaker.position = position;

        // Glass material with transparency
        const glassMaterial = new BABYLON.PBRMaterial(`${name}Glass`, scene);
        glassMaterial.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
        glassMaterial.metallic = 0.1;
        glassMaterial.roughness = 0.05;
        glassMaterial.alpha = 0.3;
        glassMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        glassMaterial.backFaceCulling = false;
        beaker.material = glassMaterial;
        shadowGenerator.addShadowCaster(beaker);

        // Inner liquid placeholder
        const liquid = BABYLON.MeshBuilder.CreateCylinder(`${name}Liquid`, {
            height: 0.01,
            diameter: radius * 1.7,
            tessellation: 32
        }, scene);
        liquid.position = new BABYLON.Vector3(position.x, position.y - 0.15, position.z);
        liquid.isVisible = false;

        const liquidMaterial = new BABYLON.PBRMaterial(`${name}LiquidMat`, scene);
        liquidMaterial.albedoColor = new BABYLON.Color3(0.5, 0.7, 1);
        liquidMaterial.metallic = 0;
        liquidMaterial.roughness = 0.1;
        liquidMaterial.alpha = 0.8;
        liquid.material = liquidMaterial;

        beaker.metadata = {
            type: 'beaker',
            name: name,
            liquid: liquid,
            contents: [],
            volume: 0,
            maxVolume: 250,
            isClickable: true
        };

        return beaker;
    };

    // Create test tube rack with tubes
    const createTestTubeRack = (scene, position, shadowGenerator) => {
        const rack = BABYLON.MeshBuilder.CreateBox('testTubeRack', { width: 0.8, height: 0.1, depth: 0.2 }, scene);
        rack.position = position;

        const rackMaterial = new BABYLON.PBRMaterial('rackMat', scene);
        rackMaterial.albedoColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        rackMaterial.metallic = 0;
        rackMaterial.roughness = 0.8;
        rack.material = rackMaterial;
        shadowGenerator.addShadowCaster(rack);

        // Create test tubes
        const tubes = [];
        for (let i = 0; i < 5; i++) {
            const tube = BABYLON.MeshBuilder.CreateCylinder(`testTube${i}`, {
                height: 0.25,
                diameterTop: 0.05,
                diameterBottom: 0.02,
                tessellation: 16
            }, scene);
            tube.position = new BABYLON.Vector3(
                position.x - 0.3 + i * 0.15,
                position.y + 0.18,
                position.z
            );

            const tubeMaterial = new BABYLON.PBRMaterial(`tubeMat${i}`, scene);
            tubeMaterial.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
            tubeMaterial.metallic = 0.1;
            tubeMaterial.roughness = 0.05;
            tubeMaterial.alpha = 0.3;
            tube.material = tubeMaterial;
            shadowGenerator.addShadowCaster(tube);

            tube.metadata = {
                type: 'testTube',
                name: `testTube${i}`,
                contents: [],
                volume: 0,
                maxVolume: 25,
                isClickable: true
            };

            tubes.push(tube);
        }

        return { rack, tubes };
    };

    // Create conical flask
    const createConicalFlask = (scene, name, position, shadowGenerator) => {
        const flask = BABYLON.MeshBuilder.CreateCylinder(name, {
            height: 0.35,
            diameterTop: 0.1,
            diameterBottom: 0.35,
            tessellation: 32
        }, scene);
        flask.position = position;

        const flaskMaterial = new BABYLON.PBRMaterial(`${name}Mat`, scene);
        flaskMaterial.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
        flaskMaterial.metallic = 0.1;
        flaskMaterial.roughness = 0.05;
        flaskMaterial.alpha = 0.3;
        flaskMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        flask.material = flaskMaterial;
        shadowGenerator.addShadowCaster(flask);

        flask.metadata = {
            type: 'flask',
            name: name,
            contents: [],
            volume: 0,
            maxVolume: 250,
            isClickable: true
        };

        return flask;
    };

    // Create Bunsen burner
    const createBunsenBurner = (scene, position, shadowGenerator) => {
        // Base
        const base = BABYLON.MeshBuilder.CreateCylinder('burnerBase', {
            height: 0.05,
            diameter: 0.2
        }, scene);
        base.position = position;

        const baseMaterial = new BABYLON.PBRMaterial('burnerBaseMat', scene);
        baseMaterial.albedoColor = new BABYLON.Color3(0.2, 0.2, 0.25);
        baseMaterial.metallic = 0.8;
        baseMaterial.roughness = 0.3;
        base.material = baseMaterial;
        shadowGenerator.addShadowCaster(base);

        // Tube
        const tube = BABYLON.MeshBuilder.CreateCylinder('burnerTube', {
            height: 0.25,
            diameter: 0.06
        }, scene);
        tube.position = new BABYLON.Vector3(position.x, position.y + 0.15, position.z);
        tube.material = baseMaterial;
        shadowGenerator.addShadowCaster(tube);

        // Flame (invisible by default)
        const flame = BABYLON.MeshBuilder.CreateCylinder('flame', {
            height: 0.15,
            diameterTop: 0.01,
            diameterBottom: 0.05,
            tessellation: 16
        }, scene);
        flame.position = new BABYLON.Vector3(position.x, position.y + 0.35, position.z);

        const flameMaterial = new BABYLON.StandardMaterial('flameMat', scene);
        flameMaterial.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
        flameMaterial.alpha = 0.8;
        flame.material = flameMaterial;
        flame.isVisible = false;

        base.metadata = {
            type: 'bunsenBurner',
            name: 'bunsenBurner',
            flame: flame,
            isOn: false,
            isClickable: true
        };

        return { base, tube, flame };
    };

    // Create tripod stand
    const createTripodStand = (scene, position, shadowGenerator) => {
        const tripodMaterial = new BABYLON.PBRMaterial('tripodMat', scene);
        tripodMaterial.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.35);
        tripodMaterial.metallic = 0.9;
        tripodMaterial.roughness = 0.4;

        // Three legs
        const legs = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const leg = BABYLON.MeshBuilder.CreateCylinder(`tripodLeg${i}`, {
                height: 0.15,
                diameter: 0.015
            }, scene);
            leg.position = new BABYLON.Vector3(
                position.x + Math.cos(angle) * 0.08,
                position.y + 0.075,
                position.z + Math.sin(angle) * 0.08
            );
            leg.rotation.x = angle * 0.3;
            leg.material = tripodMaterial;
            shadowGenerator.addShadowCaster(leg);
            legs.push(leg);
        }

        // Ring
        const ring = BABYLON.MeshBuilder.CreateTorus('tripodRing', {
            diameter: 0.18,
            thickness: 0.015,
            tessellation: 32
        }, scene);
        ring.position = new BABYLON.Vector3(position.x, position.y + 0.15, position.z);
        ring.material = tripodMaterial;
        shadowGenerator.addShadowCaster(ring);

        return { legs, ring };
    };

    // Create measuring cylinder
    const createMeasuringCylinder = (scene, position, shadowGenerator) => {
        const cylinder = BABYLON.MeshBuilder.CreateCylinder('measuringCylinder', {
            height: 0.5,
            diameterTop: 0.08,
            diameterBottom: 0.1,
            tessellation: 32
        }, scene);
        cylinder.position = position;

        const cylinderMaterial = new BABYLON.PBRMaterial('cylinderMat', scene);
        cylinderMaterial.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
        cylinderMaterial.metallic = 0.1;
        cylinderMaterial.roughness = 0.05;
        cylinderMaterial.alpha = 0.3;
        cylinder.material = cylinderMaterial;
        shadowGenerator.addShadowCaster(cylinder);

        cylinder.metadata = {
            type: 'measuringCylinder',
            name: 'measuringCylinder',
            contents: [],
            volume: 0,
            maxVolume: 100,
            isClickable: true
        };

        return cylinder;
    };

    // Create stirring rod
    const createStirringRod = (scene, position, shadowGenerator) => {
        const rod = BABYLON.MeshBuilder.CreateCylinder('stirringRod', {
            height: 0.3,
            diameter: 0.015
        }, scene);
        rod.position = position;
        rod.rotation.z = Math.PI / 6;

        const rodMaterial = new BABYLON.PBRMaterial('rodMat', scene);
        rodMaterial.albedoColor = new BABYLON.Color3(0.9, 0.95, 1);
        rodMaterial.metallic = 0.1;
        rodMaterial.roughness = 0.1;
        rodMaterial.alpha = 0.4;
        rod.material = rodMaterial;
        shadowGenerator.addShadowCaster(rod);

        rod.metadata = {
            type: 'stirringRod',
            name: 'stirringRod',
            isClickable: true
        };

        return rod;
    };

    // Toggle Bunsen burner (called from UI button)
    const toggleBurner = () => {
        const currentLabObjects = labObjectsRef.current;
        if (!currentLabObjects.bunsenBurner) return;

        const newState = !isBurnerOnRef.current;
        setIsBurnerOn(newState);
        isBurnerOnRef.current = newState;

        if (currentLabObjects.bunsenBurner.flame) {
            currentLabObjects.bunsenBurner.flame.isVisible = newState;
        }

        if (newState) {
            const scene = sceneRef.current;
            if (scene) {
                const flame = currentLabObjects.bunsenBurner.flame;
                scene.registerBeforeRender(() => {
                    if (flame && flame.isVisible) {
                        flame.scaling.x = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                        flame.scaling.z = 1 + Math.cos(Date.now() * 0.012) * 0.1;
                    }
                });
            }
        }
    };

    // Trigger reaction visual effect
    const triggerReaction = (containerMesh, reaction) => {
        const scene = sceneRef.current;
        if (!scene) return;

        setActiveReaction(reaction);
        setShowEquation(true);

        // Create particle effect based on reaction type
        createReactionEffect(scene, containerMesh.position, reaction.visualEffect, reaction.resultColor);

        // Update liquid color to result
        if (containerMesh.metadata?.liquid) {
            setTimeout(() => {
                containerMesh.metadata.liquid.material.albedoColor = BABYLON.Color3.FromHexString(reaction.resultColor);
            }, reaction.duration * 500);
        }

        // Show result after effect
        setTimeout(() => {
            setResultSummary({
                equation: reaction.equation,
                explanation: reaction.explanation,
                type: reaction.type
            });
        }, reaction.duration * 1000);
    };

    // Create reaction particle effect
    const createReactionEffect = (scene, position, effectType, resultColor) => {
        const params = getParticleParams(effectType);

        // Create particle system
        const particleSystem = new BABYLON.ParticleSystem('reaction', params.count, scene);

        // Texture
        particleSystem.particleTexture = new BABYLON.Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AEGBkZQTQDNgGwSgwVAFbmAgXxvZSoAAAAAElFTkSuQmCC', scene);

        // Emitter
        particleSystem.emitter = new BABYLON.Vector3(position.x, position.y + 0.2, position.z);
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, 0, -0.1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

        // Colors
        const color = BABYLON.Color3.FromHexString(params.particleColor || '#ffffff');
        particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
        particleSystem.color2 = new BABYLON.Color4(color.r, color.g, color.b, 0.8);
        particleSystem.colorDead = new BABYLON.Color4(color.r, color.g, color.b, 0);

        // Size
        particleSystem.minSize = params.minSize || 0.01;
        particleSystem.maxSize = params.maxSize || 0.03;

        // Lifetime
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = params.lifetime / 1000;

        // Emission
        particleSystem.emitRate = params.count;

        // Direction based on effect type
        if (effectType === 'bubbles' || effectType === 'bubbles_heat' || effectType === 'gas') {
            particleSystem.direction1 = new BABYLON.Vector3(-0.1, 1, -0.1);
            particleSystem.direction2 = new BABYLON.Vector3(0.1, 1, 0.1);
            particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0);
        } else if (effectType === 'smoke' || effectType === 'steam') {
            particleSystem.direction1 = new BABYLON.Vector3(-0.2, 1, -0.2);
            particleSystem.direction2 = new BABYLON.Vector3(0.2, 1.5, 0.2);
            particleSystem.gravity = new BABYLON.Vector3(0, 0.5, 0);
        } else if (effectType === 'precipitate') {
            particleSystem.direction1 = new BABYLON.Vector3(-0.1, -0.5, -0.1);
            particleSystem.direction2 = new BABYLON.Vector3(0.1, -0.2, 0.1);
            particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);
        }

        // Speed
        particleSystem.minEmitPower = params.speed * 0.5;
        particleSystem.maxEmitPower = params.speed;

        // Start and auto-dispose
        particleSystem.start();
        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 2000);
        }, params.duration);
    };

    // Reset lab
    const resetLab = () => {
        // Reset all containers
        Object.values(labObjects).forEach(obj => {
            if (obj.metadata) {
                obj.metadata.contents = [];
                obj.metadata.volume = 0;
                if (obj.metadata.liquid) {
                    obj.metadata.liquid.isVisible = false;
                }
            }
        });

        // Reset burner
        if (labObjects.bunsenBurner) {
            labObjects.bunsenBurner.flame.isVisible = false;
            setIsBurnerOn(false);
        }

        // Reset state
        setSelectedChemical(null);
        setSelectedTool(null);
        setActiveReaction(null);
        setShowEquation(false);
        setResultSummary(null);
        setSafetyWarning(null);
        setContainers({});
        setCurrentStep(0);
    };

    // Select chemical
    const handleChemicalSelect = (chemical) => {
        console.log('🧪 Chemical selected:', chemical.name, chemical.id);
        setSelectedChemical(chemical);
        selectedChemicalRef.current = chemical;
        setSelectedTool(null);
        selectedToolRef.current = null;
    };

    // Select tool
    const handleToolSelect = (tool) => {
        console.log('🔧 Tool selected:', tool);
        setSelectedTool(tool);
        selectedToolRef.current = tool;
        setSelectedChemical(null);
        selectedChemicalRef.current = null;
    };

    // Select guided experiment
    const handleExperimentSelect = (experiment) => {
        setSelectedExperiment(experiment);
        setInstructions(experiment.steps);
        setCurrentStep(0);
        setShowExperimentSelector(false);
        resetLab();
    };

    // Navigate to next step
    const handleNextStep = () => {
        if (currentStep < instructions.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    // Navigate to previous step
    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Handle mode change
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

    return (
        <div className="chemistry-lab">
            {/* Loading overlay */}
            {isLoading && (
                <div className="lab-loading">
                    <div className="lab-loading-content">
                        <div className="lab-loading-spinner"></div>
                        <h2>Loading Virtual Chemistry Lab</h2>
                        <p>Initializing 3D environment...</p>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <canvas ref={canvasRef} className="lab-canvas" />

            {/* Safety Warning */}
            {safetyWarning && (
                <div className="safety-warning">
                    <div className="warning-icon">⚠️</div>
                    <span>{safetyWarning}</span>
                </div>
            )}

            {/* Top Bar */}
            <div className="lab-topbar">
                <div className="lab-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
                    </svg>
                    <span>Virtual Chemistry Lab</span>
                </div>
                <div className="lab-mode-toggle">
                    <button
                        className={`mode-btn ${mode === 'free' ? 'active' : ''}`}
                        onClick={() => handleModeChange('free')}
                    >
                        Free Experiment
                    </button>
                    <button
                        className={`mode-btn ${mode === 'guided' ? 'active' : ''}`}
                        onClick={() => handleModeChange('guided')}
                    >
                        Guided Mode
                    </button>
                </div>
                <div className="lab-actions">
                    <button className="reset-btn" onClick={resetLab}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                        </svg>
                        Reset Lab
                    </button>
                    <a href="/chemistry-lab-ar" className="ar-mode-btn" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        📱 AR Mode
                    </a>
                </div>
            </div>

            {/* Selected Status Indicator */}
            {(selectedChemical || selectedTool) && (
                <div className="selection-indicator" style={{
                    position: 'absolute',
                    top: '70px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))',
                    borderRadius: '20px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    zIndex: 150,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
                }}>
                    {selectedChemical && (
                        <>
                            <span>🧪 Selected: {selectedChemical.formula}</span>
                            <span style={{ opacity: 0.7 }}>→ Click on a container</span>
                        </>
                    )}
                    {selectedTool && (
                        <>
                            <span>🔧 Tool: {selectedTool}</span>
                            <span style={{ opacity: 0.7 }}>→ Click on a container</span>
                        </>
                    )}
                    <button
                        onClick={() => {
                            setSelectedChemical(null);
                            selectedChemicalRef.current = null;
                            setSelectedTool(null);
                            selectedToolRef.current = null;
                        }}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '0.8rem'
                        }}
                    >
                        × Clear
                    </button>
                </div>
            )}

            {/* Left Sidebar - Chemicals */}
            <div className="lab-sidebar left">
                <div className="sidebar-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 2v8L8.5 14.5c-1.2 1.6-1 4.1 1 5.5 2 1.4 5 1.4 7 0 2-1.4 2.2-3.9 1-5.5L16 10V2" />
                        <path d="M8.5 2h7" />
                        <path d="M14 6h-4" />
                    </svg>
                    <span>Chemicals</span>
                </div>
                <div className="chemicals-list">
                    {chemicalsList.map(chemical => (
                        <div
                            key={chemical.id}
                            className={`chemical-item ${selectedChemical?.id === chemical.id ? 'selected' : ''} ${chemical.hazard}`}
                            onClick={() => {
                                console.log('Clicked chemical:', chemical.name);
                                handleChemicalSelect(chemical);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div
                                className="chemical-color"
                                style={{ backgroundColor: chemical.color }}
                            />
                            <div className="chemical-info">
                                <span className="chemical-formula">{chemical.formula}</span>
                                <span className="chemical-name">{chemical.name}</span>
                            </div>
                            <span className={`hazard-badge ${chemical.hazard}`}>
                                {chemical.hazard === 'danger' ? '⚠' : chemical.hazard === 'warning' ? '!' : '✓'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Sidebar - Tools */}
            <div className="lab-sidebar right">
                <div className="sidebar-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                    <span>Tools & Actions</span>
                </div>
                <div className="tools-list">
                    <button
                        className={`tool-btn ${selectedTool === 'pour' ? 'active' : ''}`}
                        onClick={() => handleToolSelect('pour')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 2h8v6l4 10H4L8 8V2z" />
                            <path d="M10 2v6" />
                            <path d="M14 2v6" />
                        </svg>
                        Pour Liquid
                    </button>
                    <button
                        className={`tool-btn ${isBurnerOn ? 'active burner-on' : ''}`}
                        onClick={toggleBurner}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                        </svg>
                        {isBurnerOn ? 'Burner ON' : 'Bunsen Burner'}
                    </button>
                    <button
                        className={`tool-btn ${selectedTool === 'stir' ? 'active' : ''}`}
                        onClick={() => handleToolSelect('stir')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v4" />
                            <path d="M12 18v4" />
                            <path d="M4.93 4.93l2.83 2.83" />
                            <path d="M16.24 16.24l2.83 2.83" />
                        </svg>
                        Stir
                    </button>
                    <button
                        className={`tool-btn ${selectedTool === 'measure' ? 'active' : ''}`}
                        onClick={() => handleToolSelect('measure')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M7 16l4-8 4 5 4-7" />
                        </svg>
                        Measure
                    </button>
                </div>

                {/* Burner Status */}
                {isBurnerOn && (
                    <div className="burner-status">
                        <div className="flame-icon">🔥</div>
                        <span>Burner is heating</span>
                    </div>
                )}
            </div>

            {/* Bottom Panel - Instructions / Results */}
            {showInstructions && (
                <div className="lab-bottom-panel">
                    <button
                        className="panel-toggle"
                        onClick={() => setShowInstructions(!showInstructions)}
                    >
                        {showInstructions ? '▼' : '▲'}
                    </button>
                    <div className="panel-content">
                        {mode === 'guided' && selectedExperiment ? (
                            <div className="guided-instructions">
                                <h3>{selectedExperiment.title}</h3>
                                <div className="step-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${((currentStep + 1) / instructions.length) * 100}%` }}
                                        />
                                    </div>
                                    <span>Step {currentStep + 1} of {instructions.length}</span>
                                </div>
                                <p className="current-instruction">
                                    {instructions[currentStep]?.instruction || 'Select an experiment to begin'}
                                </p>
                                <div className="step-navigation">
                                    <button
                                        className="nav-btn prev"
                                        onClick={handlePrevStep}
                                        disabled={currentStep === 0}
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        className="nav-btn next"
                                        onClick={handleNextStep}
                                        disabled={currentStep >= instructions.length - 1}
                                    >
                                        Next →
                                    </button>
                                </div>
                                <button
                                    className="change-experiment-btn"
                                    onClick={() => setShowExperimentSelector(true)}
                                >
                                    Change Experiment
                                </button>
                            </div>
                        ) : mode === 'guided' ? (
                            <div className="guided-instructions">
                                <h3>Guided Mode</h3>
                                <p>Select an experiment to get step-by-step instructions</p>
                                <button
                                    className="select-experiment-btn"
                                    onClick={() => setShowExperimentSelector(true)}
                                >
                                    Choose Experiment
                                </button>
                            </div>
                        ) : (
                            <div className="free-mode-tips">
                                <h3>Free Experiment Mode</h3>
                                <p>Select chemicals from the left panel and click on containers to add them. Use the tools on the right to interact with the equipment.</p>
                                <div className="quick-tips">
                                    <span>💡 Tip: Try mixing HCl with NaOH for a neutralization reaction</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Experiment Selector Modal */}
            {showExperimentSelector && (
                <div className="experiment-selector-modal">
                    <div className="experiment-selector-content">
                        <button
                            className="close-modal"
                            onClick={() => setShowExperimentSelector(false)}
                        >×</button>
                        <h2>🧪 Choose an Experiment</h2>
                        <p className="modal-subtitle">Select a guided experiment to follow step-by-step instructions</p>
                        <div className="experiments-grid">
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
                                    <p className="exp-description">{exp.description}</p>
                                    <div className="exp-chemicals">
                                        {exp.chemicals.map(chem => (
                                            <span key={chem} className="chem-tag">{chem}</span>
                                        ))}
                                    </div>
                                    <div className="exp-steps">
                                        {exp.steps.length} steps
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Equation Popup */}
            {showEquation && activeReaction && (
                <div className="equation-popup">
                    <button className="close-popup" onClick={() => setShowEquation(false)}>×</button>
                    <div className="equation-content">
                        <h3>Chemical Reaction</h3>
                        <div className="equation-display">
                            {activeReaction.equation}
                        </div>
                        <div className="reaction-type">
                            Type: {activeReaction.type?.replace('_', ' ').toUpperCase()}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Summary */}
            {resultSummary && (
                <div className="result-summary-modal">
                    <div className="result-summary-content">
                        <button className="close-modal" onClick={() => setResultSummary(null)}>×</button>
                        <div className="result-icon">🧪</div>
                        <h2>Reaction Complete!</h2>
                        <div className="result-equation">{resultSummary.equation}</div>
                        <div className="result-explanation">{resultSummary.explanation}</div>
                        <div className="result-type">
                            <span className="type-label">Reaction Type:</span>
                            <span className="type-value">{resultSummary.type?.replace('_', ' ')}</span>
                        </div>
                        <button className="continue-btn" onClick={() => setResultSummary(null)}>
                            Continue Experimenting
                        </button>
                    </div>
                </div>
            )}

            {/* Camera Controls Help */}
            <div className="camera-controls-help">
                <div className="control-hint">
                    <span className="key">🖱️ Left</span>
                    <span>Rotate</span>
                </div>
                <div className="control-hint">
                    <span className="key">🖱️ Right</span>
                    <span>Pan</span>
                </div>
                <div className="control-hint">
                    <span className="key">⚙️ Scroll</span>
                    <span>Zoom</span>
                </div>
            </div>
        </div>
    );
};

export default ChemistryLab;
