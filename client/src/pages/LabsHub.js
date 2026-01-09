import React from 'react';
import { useNavigate } from 'react-router-dom';

import './LabsHub.css';

const LabsHub = () => {
    const navigate = useNavigate();

    const labs = [
        {
            id: 'chemistry',
            title: 'Virtual Chemistry Lab',
            description: 'Experience a fully interactive 3D virtual chemistry laboratory. Perform experiments safely in a simulated environment.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 18h8" />
                    <path d="M3 22h18" />
                    <path d="M14 22a7 7 0 1 0 0-14h-1" />
                    <path d="M9 14h2" />
                    <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
                    <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
                </svg>
            ),
            route: '/chemistry-lab',
            color: 'blue'
        },
        {
            id: 'ar-chemistry',
            title: 'AR Chemistry Lab',
            description: 'Bring chemistry to life in your own space using Augmented Reality. Visualize molecules and reactions through your camera.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                    <path d="M12 9v.01" />
                </svg>
            ),
            route: '/ar-chemistry-camera',
            color: 'purple'
        },
        {
            id: 'coding',
            title: 'Coding Grounds',
            description: 'Advanced online code editor and compiler. Write, compile, and run code in multiple languages directly in your browser.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                </svg>
            ),
            route: '/coding-grounds',
            color: 'green'
        },
        {
            id: 'diagram',
            title: 'AI Diagram Generator',
            description: 'Generate flowcharts, class diagrams, and more from text descriptions using AI. Supports Mermaid, Graphviz, and more.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                </svg>
            ),
            route: '/diagram-generator',
            color: 'orange'
        }
    ];

    return (
        <div className="labs-hub-page">
            <div className="labs-hub-container">
                <header className="labs-header">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1>Interactive Labs & Tools</h1>
                    <p>Select a laboratory environment to begin your practical learning journey.</p>
                </header>

                <div className="labs-grid">
                    {labs.map((lab) => (
                        <div
                            key={lab.id}
                            className={`lab-card ${lab.color}`}
                            onClick={() => navigate(lab.route)}
                        >
                            <div className="lab-icon-wrapper">
                                {lab.icon}
                            </div>
                            <div className="lab-content">
                                <h2>{lab.title}</h2>
                                <p>{lab.description}</p>
                            </div>
                            <div className="lab-action">
                                <span>Enter Lab</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LabsHub;
