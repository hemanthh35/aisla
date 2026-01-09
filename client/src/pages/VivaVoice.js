import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import './VivaVoice.css';

const VivaVoice = () => {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState('Ready to Start');
    const [isConnecting, setIsConnecting] = useState(false);
    const vapiRef = useRef(null);

    // Initialize Vapi
    useEffect(() => {
        const vapi = new Vapi("1b738154-18a6-467e-82ce-8495484dec94"); // Public API Key
        vapiRef.current = vapi;

        // Event listeners for state changes
        vapi.on('call-start', () => {
            console.log('Call started');
            setIsActive(true);
            setIsConnecting(false);
            setStatus('Listening...');
        });

        vapi.on('call-end', () => {
            console.log('Call ended');
            setIsActive(false);
            setIsConnecting(false);
            setStatus('Session Ended');
            setTimeout(() => setStatus('Ready to Start'), 3000);
        });

        vapi.on('speech-start', () => {
            setStatus('AI Speaking...');
        });

        vapi.on('speech-end', () => {
            setStatus('Listening...');
        });

        vapi.on('error', (e) => {
            console.error(e);
            setStatus('Error occurred');
            setIsActive(false);
            setIsConnecting(false);
        });

        return () => {
            if (vapiRef.current) {
                vapiRef.current.stop();
            }
        };
    }, []);

    const startViva = async () => {
        if (vapiRef.current) {
            setIsConnecting(true);
            setStatus('Connecting to Assistant...');
            try {
                await vapiRef.current.start("49066f2f-3159-4844-86bf-50b2bc8c5d64"); // Assistant ID
            } catch (err) {
                console.error("Failed to start:", err);
                setStatus('Failed to Connect');
                setIsConnecting(false);
            }
        }
    };

    const stopViva = () => {
        if (vapiRef.current) {
            vapiRef.current.stop();
        }
    };

    return (
        <div className="viva-voice-container">
            <div className="bg-glow"></div>

            <Link to="/labs" className="viva-back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Labs
            </Link>

            <header className="viva-header">
                <h1 className="viva-title">AISLA Viva Voice</h1>
                <p className="viva-subtitle">Interactive AI-powered voice assessment</p>
            </header>

            <div className="viva-content">
                <div className={`visualizer-container ${isActive ? 'active' : ''}`}>
                    <div className="visualizer-ring r1"></div>
                    <div className="visualizer-ring r2"></div>
                    <div className="visualizer-ring r3"></div>

                    <div className="visualizer-main">
                        <div className="visualizer-icon">
                            {isActive ? (
                                <svg viewBox="0 0 24 24" fill="currentColor" width="60" height="60">
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z" />
                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor" width="60" height="60">
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z" />
                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                    <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`status-pill ${isActive ? 'active' : ''} ${status.includes('Error') || status.includes('Failed') ? 'error' : ''}`}>
                    {status}
                </div>

                <div className="controls">
                    {!isActive ? (
                        <button
                            className="viva-btn btn-start"
                            onClick={startViva}
                            disabled={isConnecting}
                        >
                            {isConnecting ? (
                                <>
                                    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Start Viva
                                </>
                            )}
                        </button>
                    ) : (
                        <button className="viva-btn btn-stop" onClick={stopViva}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="6" width="12" height="12" />
                            </svg>
                            Stop Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VivaVoice;
