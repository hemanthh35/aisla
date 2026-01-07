// AR Chemistry Lab - Camera-Based 2D AR Experience
// Pure canvas-based rendering with no 3D libraries
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ARChemistryLabCamera.css';

const ARChemistryLabCamera = () => {
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const touchStartRef = useRef({ x: 0, y: 0 });

    // State
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied', 'requesting'
    const [showPermissionUI, setShowPermissionUI] = useState(false);
    const [isCheckingPermission, setIsCheckingPermission] = useState(true);
    const [selectedElement, setSelectedElement] = useState(null);
    const [placedElements, setPlacedElements] = useState([]);
    const [activeReaction, setActiveReaction] = useState(null);
    const [showEquationPanel, setShowEquationPanel] = useState(false);
    const [showElementInfo, setShowElementInfo] = useState(null);
    const [reactionAnimation, setReactionAnimation] = useState(null);
    const [showTutor, setShowTutor] = useState(false);
    const [tutorMessage, setTutorMessage] = useState('');
    const [showExperiments, setShowExperiments] = useState(false);
    const [selectedExperiment, setSelectedExperiment] = useState(null);
    const [draggingElement, setDraggingElement] = useState(null);
    const [bonds, setBonds] = useState([]);

    // Chemical Elements Database
    const elements = {
        // Basic Elements
        'H': { id: 'H', name: 'Hydrogen', symbol: 'H', color: '#FFFFFF', valency: 1, type: 'nonmetal', atomicNumber: 1, mass: 1.008 },
        'O': { id: 'O', name: 'Oxygen', symbol: 'O', color: '#FF4444', valency: 2, type: 'nonmetal', atomicNumber: 8, mass: 16.00 },
        'N': { id: 'N', name: 'Nitrogen', symbol: 'N', color: '#4444FF', valency: 3, type: 'nonmetal', atomicNumber: 7, mass: 14.01 },
        'C': { id: 'C', name: 'Carbon', symbol: 'C', color: '#333333', valency: 4, type: 'nonmetal', atomicNumber: 6, mass: 12.01 },
        'Na': { id: 'Na', name: 'Sodium', symbol: 'Na', color: '#FFD700', valency: 1, type: 'metal', atomicNumber: 11, mass: 22.99 },
        'Cl': { id: 'Cl', name: 'Chlorine', symbol: 'Cl', color: '#00FF88', valency: 1, type: 'nonmetal', atomicNumber: 17, mass: 35.45 },
        'Ca': { id: 'Ca', name: 'Calcium', symbol: 'Ca', color: '#808080', valency: 2, type: 'metal', atomicNumber: 20, mass: 40.08 },
        'Mg': { id: 'Mg', name: 'Magnesium', symbol: 'Mg', color: '#8B8989', valency: 2, type: 'metal', atomicNumber: 12, mass: 24.31 },
        'Fe': { id: 'Fe', name: 'Iron', symbol: 'Fe', color: '#B87333', valency: 3, type: 'metal', atomicNumber: 26, mass: 55.85 },
        'Cu': { id: 'Cu', name: 'Copper', symbol: 'Cu', color: '#B87333', valency: 2, type: 'metal', atomicNumber: 29, mass: 63.55 },
        'Zn': { id: 'Zn', name: 'Zinc', symbol: 'Zn', color: '#7D7F7D', valency: 2, type: 'metal', atomicNumber: 30, mass: 65.38 },
        'Ag': { id: 'Ag', name: 'Silver', symbol: 'Ag', color: '#C0C0C0', valency: 1, type: 'metal', atomicNumber: 47, mass: 107.87 },
        'S': { id: 'S', name: 'Sulfur', symbol: 'S', color: '#FFFF00', valency: 2, type: 'nonmetal', atomicNumber: 16, mass: 32.07 },
        'K': { id: 'K', name: 'Potassium', symbol: 'K', color: '#EE82EE', valency: 1, type: 'metal', atomicNumber: 19, mass: 39.10 },
        'P': { id: 'P', name: 'Phosphorus', symbol: 'P', color: '#FF6600', valency: 3, type: 'nonmetal', atomicNumber: 15, mass: 30.97 },

        // Compounds
        'HCl': { id: 'HCl', name: 'Hydrochloric Acid', symbol: 'HCl', color: '#88FF88', valency: 0, type: 'acid', isCompound: true },
        'NaOH': { id: 'NaOH', name: 'Sodium Hydroxide', symbol: 'NaOH', color: '#8888FF', valency: 0, type: 'base', isCompound: true },
        'H2SO4': { id: 'H2SO4', name: 'Sulfuric Acid', symbol: 'H₂SO₄', color: '#FFAA00', valency: 0, type: 'acid', isCompound: true },
        'CaCO3': { id: 'CaCO3', name: 'Calcium Carbonate', symbol: 'CaCO₃', color: '#FFFFFF', valency: 0, type: 'salt', isCompound: true },
        'AgNO3': { id: 'AgNO3', name: 'Silver Nitrate', symbol: 'AgNO₃', color: '#E0E0E0', valency: 0, type: 'salt', isCompound: true },
        'CuSO4': { id: 'CuSO4', name: 'Copper Sulfate', symbol: 'CuSO₄', color: '#0066CC', valency: 0, type: 'salt', isCompound: true },
        'NaCl': { id: 'NaCl', name: 'Sodium Chloride', symbol: 'NaCl', color: '#FFFFFF', valency: 0, type: 'salt', isCompound: true },
        'Ca(OH)2': { id: 'Ca(OH)2', name: 'Calcium Hydroxide', symbol: 'Ca(OH)₂', color: '#F5F5F5', valency: 0, type: 'base', isCompound: true },
        'CO2': { id: 'CO2', name: 'Carbon Dioxide', symbol: 'CO₂', color: '#AAAAAA', valency: 0, type: 'gas', isCompound: true },
        'NH4Cl': { id: 'NH4Cl', name: 'Ammonium Chloride', symbol: 'NH₄Cl', color: '#E8E8E8', valency: 0, type: 'salt', isCompound: true },
        'FeSO4': { id: 'FeSO4', name: 'Iron Sulfate', symbol: 'FeSO₄', color: '#90EE90', valency: 0, type: 'salt', isCompound: true },
        'ZnSO4': { id: 'ZnSO4', name: 'Zinc Sulfate', symbol: 'ZnSO₄', color: '#EEEEEE', valency: 0, type: 'salt', isCompound: true },
    };

    // Reactions Database
    const reactions = [
        // Bonding Experiments
        {
            id: 'water',
            reactants: ['H', 'O'],
            products: ['H2O'],
            equation: '2H + O → H₂O',
            balancedEquation: '2H₂ + O₂ → 2H₂O',
            type: 'Covalent Bond',
            bondType: 'covalent',
            description: 'Hydrogen and Oxygen form water through covalent bonding, sharing electrons.',
            explanation: 'When hydrogen atoms bond with oxygen, they share electrons. Each hydrogen shares its single electron with oxygen, forming strong covalent bonds. This creates water - the most essential compound for life!',
            resultColor: '#4488FF',
            visualEffect: 'glow'
        },
        {
            id: 'salt',
            reactants: ['Na', 'Cl'],
            products: ['NaCl'],
            equation: 'Na + Cl → NaCl',
            balancedEquation: '2Na + Cl₂ → 2NaCl',
            type: 'Ionic Bond',
            bondType: 'ionic',
            description: 'Sodium donates an electron to Chlorine, forming an ionic bond.',
            explanation: 'Sodium, a metal, loses its outer electron to chlorine, a nonmetal. This transfer creates Na⁺ and Cl⁻ ions that attract each other electrostatically, forming table salt!',
            resultColor: '#FFFFFF',
            visualEffect: 'spark'
        },
        {
            id: 'co2',
            reactants: ['C', 'O'],
            products: ['CO2'],
            equation: 'C + O₂ → CO₂',
            balancedEquation: 'C + O₂ → CO₂',
            type: 'Double Covalent Bond',
            bondType: 'double-covalent',
            description: 'Carbon forms double covalent bonds with two oxygen atoms.',
            explanation: 'Carbon shares two pairs of electrons with each oxygen atom, forming double bonds. This creates carbon dioxide, a linear molecule important in photosynthesis and respiration!',
            resultColor: '#AAAAAA',
            visualEffect: 'bubble'
        },
        {
            id: 'ammonia',
            reactants: ['N', 'H'],
            products: ['NH3'],
            equation: 'N + 3H → NH₃',
            balancedEquation: 'N₂ + 3H₂ → 2NH₃',
            type: 'Covalent Bond',
            bondType: 'covalent',
            description: 'Nitrogen bonds with three hydrogen atoms through covalent bonds.',
            explanation: 'Nitrogen has 5 valence electrons and needs 3 more. It shares electrons with 3 hydrogen atoms to form ammonia, creating a pyramidal molecule with a lone pair!',
            resultColor: '#AAFFAA',
            visualEffect: 'glow'
        },

        // Reaction Types
        {
            id: 'neutralization',
            reactants: ['HCl', 'NaOH'],
            products: ['NaCl', 'H2O'],
            equation: 'HCl + NaOH → NaCl + H₂O',
            balancedEquation: 'HCl + NaOH → NaCl + H₂O',
            type: 'Neutralization',
            bondType: 'ionic',
            description: 'Acid and base neutralize to form salt and water.',
            explanation: 'The H⁺ from the acid combines with OH⁻ from the base to form water, while Na⁺ and Cl⁻ form salt. This is an exothermic reaction that releases heat!',
            resultColor: '#FFFFFF',
            visualEffect: 'heat'
        },
        {
            id: 'zinc_hcl',
            reactants: ['Zn', 'HCl'],
            products: ['ZnCl2', 'H2'],
            equation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
            balancedEquation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
            type: 'Single Displacement',
            bondType: 'ionic',
            description: 'Zinc displaces hydrogen from hydrochloric acid, producing hydrogen gas.',
            explanation: 'Zinc is more reactive than hydrogen, so it replaces hydrogen in HCl. The released hydrogen gas bubbles vigorously - you can hear it fizz!',
            resultColor: '#88FF88',
            visualEffect: 'bubble'
        },
        {
            id: 'copper_displacement',
            reactants: ['Cu', 'AgNO3'],
            products: ['Cu(NO3)2', 'Ag'],
            equation: 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag',
            balancedEquation: 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag',
            type: 'Displacement',
            bondType: 'ionic',
            description: 'Copper displaces silver from silver nitrate solution.',
            explanation: 'Copper is more reactive than silver. When copper wire is placed in silver nitrate solution, pure silver crystals form while the solution turns blue!',
            resultColor: '#0088FF',
            visualEffect: 'crystal'
        },
        {
            id: 'decomposition',
            reactants: ['CaCO3'],
            products: ['CaO', 'CO2'],
            equation: 'CaCO₃ → CaO + CO₂↑',
            balancedEquation: 'CaCO₃ → CaO + CO₂↑',
            type: 'Decomposition',
            bondType: 'ionic',
            requiresHeat: true,
            description: 'Calcium carbonate decomposes when heated to form quickite and carbon dioxide.',
            explanation: 'When heated strongly, calcium carbonate breaks down into calcium oxide (quickie) and carbon dioxide gas. This is how it is made!',
            resultColor: '#FFFFCC',
            visualEffect: 'bubble'
        },
        {
            id: 'combustion',
            reactants: ['H', 'O'],
            products: ['H2O'],
            equation: '2H₂ + O₂ → 2H₂O',
            balancedEquation: '2H₂ + O₂ → 2H₂O',
            type: 'Combustion',
            bondType: 'covalent',
            description: 'Hydrogen burns in oxygen with a blue flame.',
            explanation: 'The combustion of hydrogen is highly exothermic. It releases a lot of energy as heat and light, producing only water - making it a clean fuel!',
            resultColor: '#4488FF',
            visualEffect: 'flame'
        },

        // Salt, Acid, Base Reactions
        {
            id: 'gas_evolution',
            reactants: ['CaCO3', 'HCl'],
            products: ['CaCl2', 'H2O', 'CO2'],
            equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
            balancedEquation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
            type: 'Gas Evolution',
            bondType: 'ionic',
            description: 'Calcium carbonate reacts with acid to produce carbon dioxide bubbles.',
            explanation: 'The acid reacts with carbonate, releasing carbon dioxide gas. This is why antacids fizz when you take them - they neutralite stomach acid!',
            resultColor: '#CCFFCC',
            visualEffect: 'bubble'
        },
        {
            id: 'precipitation_silver',
            reactants: ['AgNO3', 'NaCl'],
            products: ['AgCl', 'NaNO3'],
            equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
            balancedEquation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
            type: 'Precipitation',
            bondType: 'ionic',
            description: 'Silver chloride precipitates as a white solid.',
            explanation: 'Silver ions and chloride ions are insoluble together. When mixed, they instantly form white silver chloride precipitate that settles at the bottom!',
            resultColor: '#FFFFFF',
            visualEffect: 'precipitate'
        },
        {
            id: 'limewater',
            reactants: ['Ca(OH)2', 'CO2'],
            products: ['CaCO3', 'H2O'],
            equation: 'Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O',
            balancedEquation: 'Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O',
            type: 'Precipitation',
            bondType: 'ionic',
            description: 'Limewater turns milky when carbon dioxide is passed through it.',
            explanation: 'This is the classic test for CO₂! The calcium hydroxide solution reacts with CO₂ to form insoluble calcium carbonate, making it look milky white!',
            resultColor: '#FFFFEE',
            visualEffect: 'milky'
        },

        // Metal Reactivity
        {
            id: 'iron_displacement',
            reactants: ['Fe', 'CuSO4'],
            products: ['FeSO4', 'Cu'],
            equation: 'Fe + CuSO₄ → FeSO₄ + Cu',
            balancedEquation: 'Fe + CuSO₄ → FeSO₄ + Cu',
            type: 'Displacement',
            bondType: 'ionic',
            description: 'Iron displaces copper from copper sulfate solution.',
            explanation: 'Iron is more reactive than copper. The blue solution turns green as iron takes coppers place, and brown copper metal deposits on the iron!',
            resultColor: '#90EE90',
            visualEffect: 'crystal'
        },
        {
            id: 'magnesium_combustion',
            reactants: ['Mg', 'O'],
            products: ['MgO'],
            equation: '2Mg + O₂ → 2MgO',
            balancedEquation: '2Mg + O₂ → 2MgO',
            type: 'Combustion',
            bondType: 'ionic',
            description: 'Magnesium burns with a brilliant white flame.',
            explanation: 'Magnesium is highly reactive and burns intensely in oxygen. The bright white flame is so intense you shouldnt look directly at it! It forms white magnesium oxide ash.',
            resultColor: '#FFFFFF',
            visualEffect: 'flame'
        },
        {
            id: 'zinc_copper',
            reactants: ['Zn', 'CuSO4'],
            products: ['ZnSO4', 'Cu'],
            equation: 'Zn + CuSO₄ → ZnSO₄ + Cu',
            balancedEquation: 'Zn + CuSO₄ → ZnSO₄ + Cu',
            type: 'Displacement',
            bondType: 'ionic',
            description: 'Zinc displaces copper from copper sulfate.',
            explanation: 'Zinc is above copper in the reactivity series. It pushes copper out of the solution, which deposits as reddish-brown metal while the blue solution becomes colorless!',
            resultColor: '#EEEEEE',
            visualEffect: 'crystal'
        },
    ];

    // Experiments list
    const experiments = [
        { id: 1, name: 'Water Formation', elements: ['H', 'O'], description: 'Create water by combining hydrogen and oxygen' },
        { id: 2, name: 'Salt Formation', elements: ['Na', 'Cl'], description: 'Form table salt through ionic bonding' },
        { id: 3, name: 'Acid-Base Neutralization', elements: ['HCl', 'NaOH'], description: 'Neutralize acid with base' },
        { id: 4, name: 'Carbon Dioxide', elements: ['C', 'O'], description: 'Create CO₂ with double bonds' },
        { id: 5, name: 'Ammonia Synthesis', elements: ['N', 'H'], description: 'Synthesize ammonia' },
        { id: 6, name: 'Zinc Displacement', elements: ['Zn', 'HCl'], description: 'Watch hydrogen gas evolve' },
        { id: 7, name: 'Silver Precipitation', elements: ['AgNO3', 'NaCl'], description: 'Form silver chloride precipitate' },
        { id: 8, name: 'Copper Displacement', elements: ['Fe', 'CuSO4'], description: 'Displace copper with iron' },
        { id: 9, name: 'Limewater Test', elements: ['Ca(OH)2', 'CO2'], description: 'Classic CO₂ test' },
        { id: 10, name: 'Magnesium Combustion', elements: ['Mg', 'O'], description: 'Brilliant white flame reaction' },
    ];

    // Check camera permission status on mount
    useEffect(() => {
        checkCameraPermission();
    }, []);

    // Check if we're on a secure context (HTTPS)
    const isSecureContext = () => {
        return window.isSecureContext ||
            window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
    };

    // Check if camera permission is available
    const checkCameraPermission = async () => {
        setIsCheckingPermission(true);

        try {
            // First check if we're on HTTPS (required for camera on mobile)
            if (!isSecureContext()) {
                setCameraError('⚠️ Camera requires HTTPS! You are currently on HTTP. Please access this page via HTTPS or localhost.');
                setPermissionState('denied');
                setIsCheckingPermission(false);
                return;
            }

            // Check if mediaDevices is available
            if (!navigator.mediaDevices) {
                // Try to polyfill for older browsers
                const getUserMedia = navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia;

                if (!getUserMedia) {
                    setCameraError('Camera API not available. Please use a modern browser like Chrome, Safari, or Firefox.');
                    setPermissionState('denied');
                    setIsCheckingPermission(false);
                    return;
                }
            }

            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError('Camera access not available. Please ensure you are using HTTPS and a supported browser.');
                setPermissionState('denied');
                setIsCheckingPermission(false);
                return;
            }

            // Try to check permission status using Permissions API (if available)
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const result = await navigator.permissions.query({ name: 'camera' });
                    setPermissionState(result.state);

                    // Listen for permission changes
                    result.addEventListener('change', () => {
                        setPermissionState(result.state);
                        if (result.state === 'granted') {
                            setShowPermissionUI(false);
                        }
                    });
                } catch (e) {
                    // Permissions API not supported for camera, show prompt UI
                    console.log('Permissions API not available, will request directly');
                    setPermissionState('prompt');
                }
            } else {
                setPermissionState('prompt');
            }
        } catch (err) {
            console.error('Permission check error:', err);
            setPermissionState('prompt');
        }

        setIsCheckingPermission(false);
    };

    // Request camera permission with user interaction
    const requestCameraPermission = async () => {
        setPermissionState('requesting');
        setCameraError(null);

        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Permission granted!
            setPermissionState('granted');
            setShowPermissionUI(false);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraActive(true);
                setCameraError(null);
            }
        } catch (err) {
            console.error('Camera permission error:', err);
            setPermissionState('denied');

            // Provide specific error messages
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError('Camera permission denied. Please enable it in your browser settings.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('No camera found on this device.');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setCameraError('Camera is already in use by another application.');
            } else if (err.name === 'OverconstrainedError') {
                setCameraError('Camera does not meet the required specifications.');
            } else if (err.name === 'SecurityError') {
                setCameraError('Camera access requires HTTPS. Please use a secure connection.');
            } else {
                setCameraError(`Camera error: ${err.message || 'Unknown error occurred'}`);
            }
        }
    };

    // Initialize camera (called after permission is granted)
    const startCamera = useCallback(async () => {
        if (permissionState === 'granted') {
            try {
                const constraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setCameraActive(true);
                    setCameraError(null);
                }
            } catch (err) {
                console.error('Camera error:', err);
                setCameraError('Failed to start camera. Please try again.');
            }
        } else {
            // Show permission UI
            setShowPermissionUI(true);
        }
    }, [permissionState]);

    // Handle start button click - shows permission UI first
    const handleStartClick = () => {
        if (permissionState === 'granted') {
            startCamera();
        } else if (permissionState === 'denied') {
            setShowPermissionUI(true);
        } else {
            // Request permission
            requestCameraPermission();
        }
    };

    // Stop camera
    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
        setPlacedElements([]);
        setBonds([]);
        setActiveReaction(null);
    }, []);

    // Animation loop for canvas rendering
    useEffect(() => {
        if (!cameraActive || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let animationTime = 0;

        const render = () => {
            animationTime += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw bonds between close elements
            drawBonds(ctx, animationTime);

            // Draw placed elements
            placedElements.forEach((el, index) => {
                drawElement(ctx, el, animationTime, index);
            });

            // Draw reaction animation
            if (reactionAnimation) {
                drawReactionEffect(ctx, reactionAnimation, animationTime);
            }

            // Draw dragging indicator
            if (draggingElement) {
                ctx.beginPath();
                ctx.arc(draggingElement.x, draggingElement.y, 50, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [cameraActive, placedElements, bonds, reactionAnimation, draggingElement]);

    // Draw element on canvas
    const drawElement = (ctx, el, time, index) => {
        const element = elements[el.elementId];
        if (!element) return;

        const pulseScale = 1 + Math.sin(time * 2 + index) * 0.05;
        const radius = 35 * pulseScale;

        // Outer glow
        const gradient = ctx.createRadialGradient(el.x, el.y, radius * 0.5, el.x, el.y, radius * 1.5);
        gradient.addColorStop(0, element.color + 'AA');
        gradient.addColorStop(0.5, element.color + '44');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(el.x, el.y, radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main circle
        ctx.beginPath();
        ctx.arc(el.x, el.y, radius, 0, Math.PI * 2);

        const mainGradient = ctx.createRadialGradient(el.x - radius * 0.3, el.y - radius * 0.3, 0, el.x, el.y, radius);
        mainGradient.addColorStop(0, '#FFFFFF');
        mainGradient.addColorStop(0.3, element.color);
        mainGradient.addColorStop(1, adjustColor(element.color, -40));

        ctx.fillStyle = mainGradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Symbol
        ctx.fillStyle = getContrastColor(element.color);
        ctx.font = `bold ${element.symbol.length > 2 ? '14' : '18'}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(element.symbol, el.x, el.y);

        // Valency indicator
        if (element.valency > 0) {
            ctx.font = '10px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(`${element.valency}+`, el.x + radius * 0.8, el.y - radius * 0.8);
        }
    };

    // Draw bonds between elements
    const drawBonds = (ctx, time) => {
        bonds.forEach((bond, index) => {
            const el1 = placedElements.find(e => e.id === bond.from);
            const el2 = placedElements.find(e => e.id === bond.to);

            if (!el1 || !el2) return;

            const dx = el2.x - el1.x;
            const dy = el2.y - el1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Offset for multiple bonds
            const bondOffset = bond.bondType === 'double-covalent' || bond.bondType === 'ionic' ? 6 : 0;

            // Animate bond glow
            const glowIntensity = 0.5 + Math.sin(time * 3 + index) * 0.2;

            if (bond.bondType === 'ionic') {
                // Dashed line for ionic bonds
                ctx.beginPath();
                ctx.setLineDash([8, 4]);
                ctx.moveTo(el1.x + Math.cos(angle) * 40, el1.y + Math.sin(angle) * 40);
                ctx.lineTo(el2.x - Math.cos(angle) * 40, el2.y - Math.sin(angle) * 40);
                ctx.strokeStyle = `rgba(255, 215, 0, ${glowIntensity})`;
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw electron transfer animation
                const electronPos = (time % 2) / 2;
                const ex = el1.x + (el2.x - el1.x) * electronPos;
                const ey = el1.y + (el2.y - el1.y) * electronPos;
                ctx.beginPath();
                ctx.arc(ex, ey, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#FFD700';
                ctx.fill();

            } else if (bond.bondType === 'double-covalent') {
                // Double lines for double covalent bonds
                const perpX = -Math.sin(angle) * bondOffset;
                const perpY = Math.cos(angle) * bondOffset;

                [1, -1].forEach(dir => {
                    ctx.beginPath();
                    ctx.moveTo(el1.x + Math.cos(angle) * 40 + perpX * dir, el1.y + Math.sin(angle) * 40 + perpY * dir);
                    ctx.lineTo(el2.x - Math.cos(angle) * 40 + perpX * dir, el2.y - Math.sin(angle) * 40 + perpY * dir);
                    ctx.strokeStyle = `rgba(100, 200, 255, ${glowIntensity})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                });

            } else {
                // Single covalent bond
                ctx.beginPath();
                ctx.moveTo(el1.x + Math.cos(angle) * 40, el1.y + Math.sin(angle) * 40);
                ctx.lineTo(el2.x - Math.cos(angle) * 40, el2.y - Math.sin(angle) * 40);

                const bondGradient = ctx.createLinearGradient(el1.x, el1.y, el2.x, el2.y);
                bondGradient.addColorStop(0, `rgba(100, 200, 255, ${glowIntensity})`);
                bondGradient.addColorStop(0.5, `rgba(255, 255, 255, ${glowIntensity})`);
                bondGradient.addColorStop(1, `rgba(100, 200, 255, ${glowIntensity})`);

                ctx.strokeStyle = bondGradient;
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        });
    };

    // Draw reaction visual effects
    const drawReactionEffect = (ctx, animation, time) => {
        const { x, y, type, startTime } = animation;
        const elapsed = time - startTime;

        if (elapsed > 3) {
            setReactionAnimation(null);
            return;
        }

        const progress = elapsed / 3;

        switch (type) {
            case 'glow':
                // Expanding glow circles
                for (let i = 0; i < 3; i++) {
                    const radius = 50 + progress * 200 + i * 30;
                    const alpha = (1 - progress) * 0.5;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                break;

            case 'spark':
                // Sparks flying outward
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const dist = progress * 150;
                    const sx = x + Math.cos(angle) * dist;
                    const sy = y + Math.sin(angle) * dist;
                    const alpha = 1 - progress;

                    ctx.beginPath();
                    ctx.arc(sx, sy, 5 * (1 - progress * 0.5), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                    ctx.fill();
                }
                break;

            case 'bubble':
                // Rising bubbles
                for (let i = 0; i < 15; i++) {
                    const bx = x + (Math.random() - 0.5) * 100;
                    const by = y - progress * 200 - i * 20;
                    const size = 5 + Math.random() * 10;
                    const alpha = (1 - progress) * 0.7;

                    ctx.beginPath();
                    ctx.arc(bx, by, size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
                    ctx.fill();
                }
                break;

            case 'flame':
                // Flame effect
                for (let i = 0; i < 20; i++) {
                    const fx = x + (Math.random() - 0.5) * 60;
                    const fy = y - progress * 150 - Math.random() * 50;
                    const size = 10 + Math.random() * 20;
                    const alpha = (1 - progress) * 0.8;

                    const flameGradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, size);
                    flameGradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`);
                    flameGradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha})`);
                    flameGradient.addColorStop(1, `rgba(200, 0, 0, 0)`);

                    ctx.beginPath();
                    ctx.arc(fx, fy, size, 0, Math.PI * 2);
                    ctx.fillStyle = flameGradient;
                    ctx.fill();
                }
                break;

            case 'precipitate':
                // Settling particles
                for (let i = 0; i < 30; i++) {
                    const px = x + (Math.random() - 0.5) * 80;
                    const py = y + progress * 100 + Math.random() * 30;
                    const size = 3 + Math.random() * 5;
                    const alpha = (1 - progress * 0.5) * 0.8;

                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fill();
                }
                break;

            case 'crystal':
                // Crystal formation
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const dist = 30 + progress * 50;
                    const cx = x + Math.cos(angle) * dist;
                    const cy = y + Math.sin(angle) * dist;
                    const size = 10 * (0.5 + progress * 0.5);
                    const alpha = 1 - progress * 0.5;

                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(angle + progress * Math.PI);

                    ctx.beginPath();
                    ctx.moveTo(0, -size);
                    ctx.lineTo(size * 0.6, 0);
                    ctx.lineTo(0, size);
                    ctx.lineTo(-size * 0.6, 0);
                    ctx.closePath();

                    ctx.fillStyle = `rgba(184, 115, 51, ${alpha})`;
                    ctx.fill();
                    ctx.restore();
                }
                break;

            case 'heat':
                // Heat waves
                for (let i = 0; i < 5; i++) {
                    const waveY = y - i * 40 - progress * 100;
                    const amplitude = 20 * Math.sin(time * 5 + i);
                    const alpha = (1 - progress) * 0.4;

                    ctx.beginPath();
                    ctx.moveTo(x - 60, waveY);
                    ctx.quadraticCurveTo(x - 30, waveY + amplitude, x, waveY);
                    ctx.quadraticCurveTo(x + 30, waveY - amplitude, x + 60, waveY);
                    ctx.strokeStyle = `rgba(255, 100, 50, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                break;

            case 'milky':
                // Milky cloud effect
                for (let i = 0; i < 10; i++) {
                    const cx = x + (Math.random() - 0.5) * 100;
                    const cy = y + (Math.random() - 0.5) * 60;
                    const size = 20 + Math.random() * 40;
                    const alpha = progress * 0.4;

                    const cloudGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
                    cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                    cloudGradient.addColorStop(1, 'transparent');

                    ctx.beginPath();
                    ctx.arc(cx, cy, size, 0, Math.PI * 2);
                    ctx.fillStyle = cloudGradient;
                    ctx.fill();
                }
                break;

            default:
                break;
        }
    };

    // Helper: Adjust color brightness
    const adjustColor = (color, amount) => {
        const clamp = (val) => Math.max(0, Math.min(255, val));
        const hex = color.replace('#', '');
        const r = clamp(parseInt(hex.substr(0, 2), 16) + amount);
        const g = clamp(parseInt(hex.substr(2, 2), 16) + amount);
        const b = clamp(parseInt(hex.substr(4, 2), 16) + amount);
        return `rgb(${r}, ${g}, ${b})`;
    };

    // Helper: Get contrasting text color
    const getContrastColor = (hexColor) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    };

    // Handle element selection
    const selectElement = (elementId) => {
        setSelectedElement(elementId);
        const el = elements[elementId];
        if (el) {
            setShowElementInfo(el);
        }
    };

    // Handle canvas tap to place element
    const handleCanvasTap = (e) => {
        if (!selectedElement) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX || e.touches?.[0]?.clientX;
        const y = e.clientY || e.touches?.[0]?.clientY;

        const newElement = {
            id: Date.now(),
            elementId: selectedElement,
            x: x - rect.left,
            y: y - rect.top
        };

        setPlacedElements(prev => [...prev, newElement]);
        checkForReactions([...placedElements, newElement]);
        setSelectedElement(null);
    };

    // Handle touch start for dragging
    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        const rect = canvasRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Check if touching an existing element
        const touched = placedElements.find(el => {
            const dx = el.x - x;
            const dy = el.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 45;
        });

        if (touched) {
            e.preventDefault();
            setDraggingElement({ ...touched, offsetX: touched.x - x, offsetY: touched.y - y });
        } else if (selectedElement) {
            handleCanvasTap(e);
        }

        touchStartRef.current = { x, y };
    };

    // Handle touch move for dragging
    const handleTouchMove = (e) => {
        if (!draggingElement) return;
        e.preventDefault();

        const touch = e.touches[0];
        const rect = canvasRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        setPlacedElements(prev => prev.map(el =>
            el.id === draggingElement.id
                ? { ...el, x: x + draggingElement.offsetX, y: y + draggingElement.offsetY }
                : el
        ));
    };

    // Handle touch end
    const handleTouchEnd = () => {
        if (draggingElement) {
            checkForReactions(placedElements);
        }
        setDraggingElement(null);
    };

    // Check for reactions between elements
    const checkForReactions = (elements) => {
        const elementIds = elements.map(e => e.elementId);

        // Check each reaction
        for (const reaction of reactions) {
            const hasAllReactants = reaction.reactants.every(r => elementIds.includes(r));

            if (hasAllReactants) {
                // Find nearby elements that could react
                for (let i = 0; i < elements.length; i++) {
                    for (let j = i + 1; j < elements.length; j++) {
                        const el1 = elements[i];
                        const el2 = elements[j];

                        if (reaction.reactants.includes(el1.elementId) &&
                            reaction.reactants.includes(el2.elementId)) {

                            const dx = el2.x - el1.x;
                            const dy = el2.y - el1.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            // If elements are close enough
                            if (distance < 120) {
                                triggerReaction(reaction, el1, el2);
                                return;
                            }
                        }
                    }
                }
            }
        }
    };

    // Trigger a reaction
    const triggerReaction = (reaction, el1, el2) => {
        // Add bond
        const newBond = {
            from: el1.id,
            to: el2.id,
            bondType: reaction.bondType,
            reactionId: reaction.id
        };
        setBonds(prev => [...prev, newBond]);

        // Set reaction animation
        const centerX = (el1.x + el2.x) / 2;
        const centerY = (el1.y + el2.y) / 2;

        setReactionAnimation({
            x: centerX,
            y: centerY,
            type: reaction.visualEffect,
            startTime: 0
        });

        setActiveReaction(reaction);
        setShowEquationPanel(true);

        // AI Tutor message
        generateTutorMessage(reaction);
    };

    // Generate tutor message
    const generateTutorMessage = (reaction) => {
        const messages = [
            `🧪 Great job! You just created a ${reaction.type} reaction!`,
            `\n\n📝 Equation: ${reaction.equation}`,
            `\n\n💡 ${reaction.explanation}`,
            `\n\n🔬 Bond Type: ${reaction.bondType.replace('-', ' ').toUpperCase()}`
        ];

        setTutorMessage(messages.join(''));
        setShowTutor(true);
    };

    // Clear all elements
    const clearAll = () => {
        setPlacedElements([]);
        setBonds([]);
        setActiveReaction(null);
        setShowEquationPanel(false);
        setShowTutor(false);
    };

    // Load experiment
    const loadExperiment = (exp) => {
        clearAll();
        setSelectedExperiment(exp);
        setShowExperiments(false);

        // Auto-select first element
        if (exp.elements.length > 0) {
            setSelectedElement(exp.elements[0]);
        }
    };

    // Element panel items - organized by category
    const elementCategories = {
        'Basic Elements': ['H', 'O', 'N', 'C', 'S', 'P'],
        'Metals': ['Na', 'K', 'Ca', 'Mg', 'Fe', 'Cu', 'Zn', 'Ag'],
        'Compounds': ['HCl', 'NaOH', 'H2SO4', 'CaCO3', 'AgNO3', 'CuSO4', 'NaCl', 'Ca(OH)2', 'CO2']
    };

    return (
        <div className="ar-chem-lab">
            {/* Camera Video Background */}
            <video
                ref={videoRef}
                className="camera-feed"
                playsInline
                muted
                autoPlay
            />

            {/* Canvas for AR Overlay */}
            <canvas
                ref={canvasRef}
                className="ar-canvas"
                onClick={handleCanvasTap}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Start Screen */}
            {!cameraActive && (
                <div className="start-screen">
                    <div className="start-content">
                        <div className="start-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1>AR Chemistry Lab</h1>
                        <p>Experience chemistry in augmented reality</p>
                        <p className="start-subtitle">Place elements, combine them, and watch reactions happen!</p>

                        {/* Permission Status Indicator */}
                        {isCheckingPermission ? (
                            <div className="permission-status checking">
                                <div className="spinner"></div>
                                <span>Checking camera access...</span>
                            </div>
                        ) : permissionState === 'granted' ? (
                            <div className="permission-status granted">
                                <span className="status-icon">✓</span>
                                <span>Camera access granted</span>
                            </div>
                        ) : permissionState === 'denied' ? (
                            <div className="permission-status denied">
                                <span className="status-icon">✕</span>
                                <span>Camera access blocked</span>
                            </div>
                        ) : null}

                        {/* Main Action Button */}
                        <button
                            className={`start-btn ${permissionState === 'requesting' ? 'loading' : ''}`}
                            onClick={handleStartClick}
                            disabled={isCheckingPermission || permissionState === 'requesting'}
                        >
                            {permissionState === 'requesting' ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Requesting Access...
                                </>
                            ) : permissionState === 'denied' ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    Enable Camera Access
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    Start Camera
                                </>
                            )}
                        </button>

                        {/* Error Message */}
                        {cameraError && (
                            <div className="camera-error">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{cameraError}</span>
                            </div>
                        )}

                        {/* Permission Denied Instructions */}
                        {permissionState === 'denied' && (
                            <div className="permission-help">
                                {cameraError?.includes('HTTPS') ? (
                                    <>
                                        <h3>🔒 Secure Connection Required</h3>
                                        <p className="help-intro">Camera access requires HTTPS (secure connection). Here's how to fix it:</p>
                                        <div className="help-steps">
                                            <div className="help-step">
                                                <span className="step-num">1</span>
                                                <span>If using <strong>DevTunnels</strong>, make sure to use the HTTPS URL</span>
                                            </div>
                                            <div className="help-step">
                                                <span className="step-num">2</span>
                                                <span>Or use <strong>ngrok</strong>: Run <code>ngrok http 3000</code> and use the https:// URL</span>
                                            </div>
                                            <div className="help-step">
                                                <span className="step-num">3</span>
                                                <span>Or access from <strong>localhost</strong> on the same device</span>
                                            </div>
                                        </div>
                                        <div className="current-url">
                                            <span>Current URL:</span>
                                            <code>{window.location.href}</code>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3>📱 How to enable camera:</h3>
                                        <div className="help-steps">
                                            <div className="help-step">
                                                <span className="step-num">1</span>
                                                <span>Tap the <strong>🔒 lock icon</strong> in the address bar</span>
                                            </div>
                                            <div className="help-step">
                                                <span className="step-num">2</span>
                                                <span>Find <strong>"Camera"</strong> or <strong>"Site Settings"</strong></span>
                                            </div>
                                            <div className="help-step">
                                                <span className="step-num">3</span>
                                                <span>Change Camera permission to <strong>"Allow"</strong></span>
                                            </div>
                                            <div className="help-step">
                                                <span className="step-num">4</span>
                                                <span>Reload the page and try again</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <button className="retry-btn" onClick={() => window.location.reload()}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                        <path d="M16 21h5v-5" />
                                    </svg>
                                    Reload Page
                                </button>
                            </div>
                        )}

                        {/* Features Grid */}
                        {permissionState !== 'denied' && (
                            <div className="features-grid">
                                <div className="feature">
                                    <span className="feature-icon">🧪</span>
                                    <span>Real-time Reactions</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">⚛️</span>
                                    <span>20+ Experiments</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">📚</span>
                                    <span>Learn Bonding</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">🎨</span>
                                    <span>Visual Effects</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Top Bar */}
            {cameraActive && (
                <div className="top-bar">
                    <button className="back-btn" onClick={stopCamera}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2>AR Chemistry Lab</h2>
                    <div className="top-actions">
                        <button className="action-btn" onClick={clearAll} title="Clear All">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </button>
                        <button className="action-btn" onClick={() => setShowExperiments(true)} title="Experiments">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Selection Indicator */}
            {selectedElement && (
                <div className="selection-indicator">
                    <span>Tap screen to place: </span>
                    <span className="selected-name" style={{ color: elements[selectedElement]?.color }}>
                        {elements[selectedElement]?.name}
                    </span>
                </div>
            )}

            {/* Bottom Elements Panel */}
            {cameraActive && (
                <div className="elements-panel">
                    <div className="elements-scroll">
                        {Object.entries(elementCategories).map(([category, ids]) => (
                            <div key={category} className="element-category">
                                <div className="category-label">{category}</div>
                                <div className="category-elements">
                                    {ids.map(id => {
                                        const el = elements[id];
                                        if (!el) return null;
                                        return (
                                            <button
                                                key={id}
                                                className={`element-btn ${selectedElement === id ? 'selected' : ''}`}
                                                onClick={() => selectElement(id)}
                                                style={{
                                                    '--el-color': el.color,
                                                    '--el-bg': `${el.color}22`
                                                }}
                                            >
                                                <span className="element-symbol">{el.symbol}</span>
                                                <span className="element-name">{el.name.length > 8 ? el.name.slice(0, 8) + '...' : el.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Side Panel - Reaction Info */}
            {showEquationPanel && activeReaction && (
                <div className="reaction-panel">
                    <button className="close-panel" onClick={() => setShowEquationPanel(false)}>×</button>
                    <div className="reaction-type-badge" data-type={activeReaction.bondType}>
                        {activeReaction.type}
                    </div>
                    <h3>Reaction Detected!</h3>
                    <div className="equation-display">
                        {activeReaction.balancedEquation}
                    </div>
                    <p className="reaction-description">{activeReaction.description}</p>
                    <div className="reaction-details">
                        <div className="detail">
                            <span className="detail-label">Bond Type:</span>
                            <span className="detail-value">{activeReaction.bondType.replace('-', ' ')}</span>
                        </div>
                        <div className="detail">
                            <span className="detail-label">Products:</span>
                            <span className="detail-value">{activeReaction.products.join(', ')}</span>
                        </div>
                    </div>
                    <button className="learn-more-btn" onClick={() => setShowTutor(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                        </svg>
                        Learn More
                    </button>
                </div>
            )}

            {/* AI Tutor Panel */}
            {showTutor && (
                <div className="tutor-overlay">
                    <div className="tutor-panel">
                        <div className="tutor-header">
                            <div className="tutor-avatar">🧑‍🔬</div>
                            <h3>Chemistry Tutor</h3>
                            <button className="close-tutor" onClick={() => setShowTutor(false)}>×</button>
                        </div>
                        <div className="tutor-content">
                            <pre className="tutor-message">{tutorMessage}</pre>
                        </div>
                        <div className="tutor-footer">
                            <button className="tutor-btn" onClick={() => setShowTutor(false)}>Got it!</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Element Info Popup */}
            {showElementInfo && (
                <div className="element-info-popup">
                    <div className="element-info-card" style={{ borderColor: showElementInfo.color }}>
                        <button className="close-info" onClick={() => setShowElementInfo(null)}>×</button>
                        <div className="element-info-header" style={{ background: `linear-gradient(135deg, ${showElementInfo.color}44, ${showElementInfo.color}22)` }}>
                            <div className="element-big-symbol" style={{ color: showElementInfo.color }}>{showElementInfo.symbol}</div>
                            <div className="element-info-name">{showElementInfo.name}</div>
                        </div>
                        <div className="element-info-body">
                            {showElementInfo.atomicNumber && (
                                <div className="info-row">
                                    <span className="info-label">Atomic Number:</span>
                                    <span className="info-value">{showElementInfo.atomicNumber}</span>
                                </div>
                            )}
                            {showElementInfo.mass && (
                                <div className="info-row">
                                    <span className="info-label">Atomic Mass:</span>
                                    <span className="info-value">{showElementInfo.mass}</span>
                                </div>
                            )}
                            <div className="info-row">
                                <span className="info-label">Valency:</span>
                                <span className="info-value">{showElementInfo.valency}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Type:</span>
                                <span className="info-value type-badge" data-type={showElementInfo.type}>{showElementInfo.type}</span>
                            </div>
                        </div>
                        <button className="info-select-btn" onClick={() => {
                            setSelectedElement(showElementInfo.id);
                            setShowElementInfo(null);
                        }}>
                            Select This Element
                        </button>
                    </div>
                </div>
            )}

            {/* Experiments Modal */}
            {showExperiments && (
                <div className="experiments-overlay">
                    <div className="experiments-modal">
                        <div className="experiments-header">
                            <h3>🧪 Experiments</h3>
                            <button className="close-experiments" onClick={() => setShowExperiments(false)}>×</button>
                        </div>
                        <div className="experiments-list">
                            {experiments.map(exp => (
                                <div key={exp.id} className="experiment-card" onClick={() => loadExperiment(exp)}>
                                    <div className="experiment-number">{exp.id}</div>
                                    <div className="experiment-content">
                                        <h4>{exp.name}</h4>
                                        <p>{exp.description}</p>
                                        <div className="experiment-elements">
                                            {exp.elements.map(elId => (
                                                <span key={elId} className="exp-element" style={{ background: elements[elId]?.color + '44', color: elements[elId]?.color }}>
                                                    {elements[elId]?.symbol || elId}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <svg className="experiment-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions for selected experiment */}
            {selectedExperiment && (
                <div className="experiment-instructions">
                    <div className="exp-inst-header">
                        <span className="exp-inst-title">{selectedExperiment.name}</span>
                        <button onClick={() => setSelectedExperiment(null)}>×</button>
                    </div>
                    <p>Place: {selectedExperiment.elements.map(e => elements[e]?.symbol || e).join(' + ')}</p>
                </div>
            )}

            {/* Placed elements count */}
            {cameraActive && placedElements.length > 0 && (
                <div className="elements-count">
                    <span>{placedElements.length} element{placedElements.length !== 1 ? 's' : ''} placed</span>
                    {bonds.length > 0 && <span> • {bonds.length} bond{bonds.length !== 1 ? 's' : ''}</span>}
                </div>
            )}

            {/* Hints */}
            {cameraActive && placedElements.length === 0 && !selectedElement && (
                <div className="hint-message">
                    <span>👆 Select an element below, then tap the screen to place it</span>
                </div>
            )}

            {cameraActive && placedElements.length === 1 && !activeReaction && (
                <div className="hint-message">
                    <span>💡 Place another element nearby to see them react!</span>
                </div>
            )}
        </div>
    );
};

export default ARChemistryLabCamera;
